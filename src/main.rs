mod config;
mod db;
mod notify;

use config::Config;
use db::compute_loudness;
use notify::send_system_notification;
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use rodio::{Decoder, OutputStream, Sink};
use std::io::Cursor;
use std::time::Instant;

// Embedded alert sound
const ALERT_OGG: &[u8] = include_bytes!("../assets/alert.ogg");

fn play_alert() {
    let (_stream, stream_handle) =
        OutputStream::try_default().expect("Failed to get output stream");
    let sink = Sink::try_new(&stream_handle).expect("Failed to create Sink");

    let cursor = Cursor::new(ALERT_OGG);
    if let Ok(source) = Decoder::new(cursor) {
        sink.append(source);
        sink.sleep_until_end(); // Wait for the sound to finish
    } else {
        println!("Failed to decode alert sound file");
    }
}

fn main() {
    let config = Config::load();
    println!(
        "Threshold: {:.1}, Frequency: {:.1}, Sensitivity: {:.1}",
        config.decibel_threshold, config.alert_frequency, config.sensitivity,
    );
    let host = cpal::default_host();
    let device = host
        .default_input_device()
        .expect("No input device available");
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

                // Print debug info
                if config.verbose > 0 {
                    println!(
                        "RMS: {:.5}, Peak: {:.5}, Hybrid: {:.5}, dB: {:.2}",
                        rms, peak, hybrid_metric, db
                    );
                }

                // Trigger alert if dB exceeds threshold
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
