use crate::config::Config;
use crate::db::compute_loudness;
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use std::io::{self, Write};
use std::sync::{Arc, Mutex};
use std::thread::sleep;
use std::time::{Duration, Instant};

// ANSI escape helpers
const BOLD: &str = "\x1b[1m";
const DIM: &str = "\x1b[2m";
const RESET: &str = "\x1b[0m";
const WHITE: &str = "\x1b[97m";
const GREEN: &str = "\x1b[32m";
const YELLOW: &str = "\x1b[33m";
const CYAN: &str = "\x1b[36m";
const RED: &str = "\x1b[31m";

const DIVIDER: &str = "────────────────────────────────────────";

pub fn run(config: &Config, duration: u64) {
    let host = cpal::default_host();
    let device = host
        .default_input_device()
        .expect("No input device available");
    let device_config = device
        .default_input_config()
        .expect("Failed to get default input config");

    let sensitivity = config.sensitivity;

    println!();
    println!("{DIM}{DIVIDER}{RESET}");
    println!("{BOLD}{WHITE}  🎤  SHHH CALIBRATION{RESET}");
    println!("{DIM}{DIVIDER}{RESET}");
    println!();

    // Phase 1: ambient noise
    println!("{BOLD}{WHITE}  🤫  STAY QUIET{RESET}");
    println!();
    wait_for_enter(&format!(
        "  Press {BOLD}{CYAN}[ENTER]{RESET} to measure ambient noise... "
    ));
    println!();
    let ambient_db = measure(&device, &device_config, sensitivity, duration);
    println!();
    println!(
        "  Ambient level: {BOLD}{GREEN}{:.1} dB{RESET}",
        ambient_db
    );

    println!();
    println!("{DIM}{DIVIDER}{RESET}");
    println!();

    // Phase 2: speech
    println!("{BOLD}{WHITE}  🗨️   SPEAK NORMALLY{RESET}");
    println!();
    wait_for_enter(&format!(
        "  Press {BOLD}{CYAN}[ENTER]{RESET}, then talk at your normal volume... "
    ));
    println!();
    let speech_db = measure(&device, &device_config, sensitivity, duration);
    println!();
    println!("  Speech level:  {BOLD}{GREEN}{:.1} dB{RESET}", speech_db);

    println!();
    println!("{DIM}{DIVIDER}{RESET}");
    println!();

    if speech_db <= ambient_db {
        println!(
            "  {BOLD}{RED}Speech was not louder than ambient noise.{RESET}"
        );
        println!("  Try again in a quieter environment.");
        println!();
        return;
    }

    // Set threshold halfway between ambient and speech (in dB space)
    let threshold = (ambient_db + speech_db) / 2.0;
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
    let peak = *peak_db.lock().unwrap();
    print!("\r                                                                        \r");
    io::stdout().flush().unwrap();

    drop(stream);
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

fn wait_for_enter(prompt: &str) {
    print!("{}", prompt);
    io::stdout().flush().unwrap();
    let mut buf = String::new();
    io::stdin().read_line(&mut buf).unwrap();
}
