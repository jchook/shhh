mod audio;
mod calibrate;
mod config;
mod db;
mod devices;
mod notify;
mod prompt;
mod style;

use audio::get_input_device;
use config::{Command, Config, FileConfig};
use db::compute_loudness;
use notify::send_system_notification;
use cpal::traits::{DeviceTrait, StreamTrait};
use rodio::{Decoder, OutputStream, Sink};
use std::io::Cursor;
use std::time::Instant;

const ALERT_OGG: &[u8] = include_bytes!("../assets/alert.ogg");

fn play_alert() {
    let (_stream, stream_handle) =
        OutputStream::try_default().expect("Failed to get output stream");
    let sink = Sink::try_new(&stream_handle).expect("Failed to create Sink");

    let cursor = Cursor::new(ALERT_OGG);
    if let Ok(source) = Decoder::new(cursor) {
        sink.append(source);
        sink.sleep_until_end();
    } else {
        println!("Failed to decode alert sound file");
    }
}

fn main() {
    let (config, command) = Config::load();

    match command {
        Some(Command::Calibrate { duration }) => {
            calibrate::run(&config, duration);
            return;
        }
        Some(Command::Init) => {
            let Some(path) = Config::config_path() else {
                eprintln!("Could not determine config directory");
                std::process::exit(1);
            };
            match FileConfig::init(&path) {
                Ok(()) => println!("Created {}", path.display()),
                Err(e) => {
                    eprintln!("{}", e);
                    std::process::exit(1);
                }
            }
            return;
        }
        Some(Command::Devices { verbose }) => {
            devices::run(verbose);
            return;
        }
        None => {}
    }

    let host = cpal::default_host();
    let device = get_input_device(&host, config.device.as_deref());
    let device_name = device.name().unwrap_or_else(|_| "unknown".into());

    println!(
        "Device: {}, Threshold: {:.1}, Frequency: {:.1}, Sensitivity: {:.1}",
        device_name, config.decibel_threshold, config.alert_frequency, config.sensitivity,
    );

    let device_config = device
        .default_input_config()
        .expect("Failed to get default input config");

    let mut last_alert = Instant::now();

    let stream = device
        .build_input_stream(
            &device_config.into(),
            move |data: &[f32], _| {
                let (rms, peak, hybrid_metric, db) =
                    compute_loudness(data, config.sensitivity);

                if config.verbose > 0 {
                    println!(
                        "RMS: {:.5}, Peak: {:.5}, Hybrid: {:.5}, dB: {:.2}",
                        rms, peak, hybrid_metric, db
                    );
                }

                if db > config.decibel_threshold
                    && last_alert.elapsed().as_secs() >= config.alert_frequency
                {
                    println!(
                        "Shhh! RMS: {:.5}, Peak: {:.5}, Hybrid: {:.5}, dB: {:.2}",
                        rms, peak, hybrid_metric, db
                    );
                    let notify = config.notify;
                    std::thread::spawn(move || {
                        play_alert();
                        if notify {
                            send_system_notification();
                        }
                    });
                    last_alert = Instant::now();
                }
            },
            move |err| eprintln!("Stream error: {}", err),
            None,
        )
        .expect("Failed to build input stream");

    stream.play().expect("Failed to start input stream");

    // Park the main thread indefinitely. If graceful shutdown is needed
    // later (e.g. flushing state), consider the `ctrlc` crate instead.
    std::thread::park();
}
