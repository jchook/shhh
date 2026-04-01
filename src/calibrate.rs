use crate::audio::get_input_device;
use crate::config::{Config, FileConfig};
use crate::loudness::compute_loudness;
use crate::prompt;
use crate::style::*;
use cpal::traits::{DeviceTrait, StreamTrait};
use std::io::{self, Write};
use std::sync::{Arc, Mutex};
use std::thread::sleep;
use std::time::{Duration, Instant};

pub fn run(config: &Config, duration: u64) {
    let host = cpal::default_host();
    let device = get_input_device(&host, config.device.as_deref());
    let device_config = device
        .default_input_config()
        .expect("Failed to get default input config");

    let sensitivity = config.sensitivity;

    println!();
    println!("{DIM}{DIVIDER}{RESET}");
    println!("{BOLD}{WHITE}  🎤  SHHH CALIBRATION{RESET}");
    println!("{DIM}{DIVIDER}{RESET}");
    println!();

    println!("{BOLD}{WHITE}  🗨️   SPEAK NORMALLY{RESET}");
    println!();
    if !prompt::wait_for_enter(&format!(
        "  Press {BOLD}{CYAN}[ENTER]{RESET}, then talk at your normal volume... "
    )) {
        println!();
        return;
    }
    println!();
    let speech_db = measure(&device, &device_config, sensitivity, duration);
    println!();
    println!("  Speech level: {BOLD}{GREEN}{:.1} dB{RESET}", speech_db);

    println!();
    println!("{DIM}{DIVIDER}{RESET}");
    println!();

    // Set threshold 3 dB above normal speech peak.
    // 3 dB ≈ doubling of sound energy — a noticeable increase over normal volume.
    let threshold = speech_db + 3.0;
    println!(
        "  {BOLD}{WHITE}✅  Recommended threshold: {YELLOW}{:.1}{RESET}",
        threshold
    );
    println!();

    // Print config snippets as "code"
    println!("{DIM}{DIVIDER}{RESET}");
    println!();
    println!("  {BOLD}{WHITE}Usage:{RESET}");
    println!();
    println!("    {DIM}${RESET} {CYAN}shhh -t {:.1}{RESET}", threshold);
    println!(
        "    {DIM}${RESET} {CYAN}SHHH_DECIBEL_THRESHOLD={:.1} shhh{RESET}",
        threshold
    );
    if let Some(path) = Config::config_path() {
        println!();
        println!(
            "  {BOLD}{WHITE}Or add to {DIM}{}{RESET}{BOLD}{WHITE}:{RESET}",
            path.display()
        );
        println!();
        println!("    {CYAN}decibel_threshold = {:.1}{RESET}", threshold);

        println!();
        println!("{DIM}{DIVIDER}{RESET}");
        println!();
        print!("  Save to config file? {BOLD}{CYAN}(y/N){RESET} ");
        io::stdout().flush().unwrap();
        let answer = prompt::read_line().unwrap_or_default();
        println!();

        if answer.eq_ignore_ascii_case("y") {
            match FileConfig::set_value(&path, "decibel_threshold", threshold) {
                Ok(()) => println!("  {GREEN}✓{RESET}  Saved to {DIM}{}{RESET}", path.display()),
                Err(e) => eprintln!("  {RED}✗{RESET}  Failed to save: {}", e),
            }
        } else {
            println!("  {DIM}Skipped.{RESET}");
        }
    }
    println!();
}

fn measure(
    device: &cpal::Device,
    device_config: &cpal::SupportedStreamConfig,
    sensitivity: f32,
    duration: u64,
) -> f32 {
    let current_db = Arc::new(Mutex::new(f32::NEG_INFINITY));
    let peak_db = Arc::new(Mutex::new(f32::NEG_INFINITY));
    let current_clone = Arc::clone(&current_db);
    let peak_clone = Arc::clone(&peak_db);

    let stream = device
        .build_input_stream(
            &device_config.clone().into(),
            move |data: &[f32], _| {
                let (_, _, _, db) = compute_loudness(data, sensitivity);
                *current_clone.lock().unwrap() = db;
                let mut peak = peak_clone.lock().unwrap();
                if db > *peak {
                    *peak = db;
                }
            },
            |err| eprintln!("Stream error: {}", err),
            None,
        )
        .expect("Failed to build input stream");

    stream.play().expect("Failed to start input stream");

    let start = Instant::now();
    let total = Duration::from_secs(duration);

    while start.elapsed() < total {
        let remaining = total - start.elapsed().min(total);
        let db = *current_db.lock().unwrap();
        let peak = *peak_db.lock().unwrap();
        let bar = level_bar(db);

        print!(
            "\r  {DIM}{:.0}s{RESET}  {bar}  {BOLD}{:.1} dB{RESET}  {DIM}peak: {:.1} dB{RESET}    ",
            remaining.as_secs_f32().ceil(),
            db,
            peak,
        );
        io::stdout().flush().unwrap();
        sleep(Duration::from_millis(80));
    }

    // Clear the live line
    print!("\r                                                                        \r");
    io::stdout().flush().unwrap();

    drop(stream);

    let peak = *peak_db.lock().unwrap();
    peak
}

fn level_bar(db: f32) -> String {
    // Map dB range to bar width (roughly -80 to 0 dB → 0 to 20 chars)
    let level = ((db + 80.0) / 80.0).clamp(0.0, 1.0);
    let width = 20;
    let filled = (level * width as f32) as usize;
    let empty = width - filled;

    let color = if level < 0.4 {
        DIM
    } else if level < 0.7 {
        YELLOW
    } else {
        RED
    };

    format!(
        "{color}{}{RESET}{DIM}{}{RESET}",
        "█".repeat(filled),
        "░".repeat(empty),
    )
}
