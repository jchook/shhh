use crate::config::Config;
use crate::db::compute_loudness;
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use std::io::{self, Write};
use std::sync::{Arc, Mutex};
use std::thread::sleep;
use std::time::Duration;

pub fn run(config: &Config, duration: u64) {
    let host = cpal::default_host();
    let device = host
        .default_input_device()
        .expect("No input device available");
    let device_config = device
        .default_input_config()
        .expect("Failed to get default input config");

    let sensitivity = config.sensitivity;

    // Phase 1: ambient noise
    wait_for_enter("Stay quiet, then press Enter to measure ambient noise...");
    println!("Listening for {} seconds...", duration);
    let ambient_db = measure(&device, &device_config, sensitivity, duration);
    println!("  Ambient level: {:.1} dB", ambient_db);

    // Phase 2: speech
    wait_for_enter("Now press Enter, then speak at your normal volume...");
    println!("Listening for {} seconds...", duration);
    let speech_db = measure(&device, &device_config, sensitivity, duration);
    println!("  Speech level:  {:.1} dB", speech_db);

    if speech_db <= ambient_db {
        println!("\nSpeech was not louder than ambient noise. Try again in a quieter environment.");
        return;
    }

    // Set threshold halfway between ambient and speech (in dB space)
    let threshold = (ambient_db + speech_db) / 2.0;
    println!("\nRecommended threshold: {:.1}", threshold);

    // Print config snippets
    println!("\nUsage:");
    println!("  shhh -t {:.1}", threshold);
    println!("  SHHH_DECIBEL_THRESHOLD={:.1} shhh", threshold);
    if let Some(path) = Config::config_path() {
        println!("\nOr add to {}:", path.display());
        println!("  decibel_threshold = {:.1}", threshold);
    }
}

fn measure(
    device: &cpal::Device,
    device_config: &cpal::SupportedStreamConfig,
    sensitivity: f32,
    duration: u64,
) -> f32 {
    let peak_db = Arc::new(Mutex::new(f32::NEG_INFINITY));
    let peak_db_clone = Arc::clone(&peak_db);

    let stream = device
        .build_input_stream(
            &device_config.clone().into(),
            move |data: &[f32], _| {
                let (_, _, _, db) = compute_loudness(data, sensitivity);
                let mut peak = peak_db_clone.lock().unwrap();
                if db > *peak {
                    *peak = db;
                }
            },
            |err| eprintln!("Stream error: {}", err),
            None,
        )
        .expect("Failed to build input stream");

    stream.play().expect("Failed to start input stream");
    sleep(Duration::from_secs(duration));
    drop(stream);

    let result = *peak_db.lock().unwrap();
    result
}

fn wait_for_enter(prompt: &str) {
    print!("{}", prompt);
    io::stdout().flush().unwrap();
    let mut buf = String::new();
    io::stdin().read_line(&mut buf).unwrap();
}
