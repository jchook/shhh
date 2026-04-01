use crate::config::{Config, FileConfig};
use crate::prompt;
use crate::style::*;
use cpal::traits::{DeviceTrait, HostTrait};
use std::io::{self, Write};

fn is_primary_device(name: &str) -> bool {
    if name == "default" {
        return true;
    }
    // On ALSA, sysdefault:CARD=* entries are the useful per-card devices.
    // Variants like front:, surround40:, iec958: are low-level PCM routes.
    if name.starts_with("sysdefault") {
        return true;
    }
    // Non-ALSA platforms (macOS, Windows) give clean names — show everything.
    !name.contains(':')
}

pub fn run(verbose: bool) {
    let host = cpal::default_host();
    let default_name = host.default_input_device().and_then(|d| d.name().ok());
    let all_devices: Vec<_> = host
        .input_devices()
        .expect("Failed to enumerate devices")
        .filter_map(|d| d.name().ok())
        .collect();

    let devices: Vec<_> = if verbose {
        all_devices
    } else {
        all_devices
            .into_iter()
            .filter(|n| is_primary_device(n))
            .collect()
    };

    if devices.is_empty() {
        println!("No input devices found.");
        return;
    }

    println!();
    println!("{DIM}{DIVIDER}{RESET}");
    println!("{BOLD}{WHITE}  🎤  INPUT DEVICES{RESET}");
    println!("{DIM}{DIVIDER}{RESET}");
    println!();

    for (i, name) in devices.iter().enumerate() {
        let is_default = default_name.as_deref() == Some(name.as_str());
        let marker = if is_default {
            format!(" {DIM}(default){RESET}")
        } else {
            String::new()
        };
        println!("  {BOLD}{CYAN}{}{RESET}  {}{}", i + 1, name, marker);
    }

    if !verbose {
        println!();
        println!("  {DIM}Run with -v to show all devices{RESET}");
    }

    println!();
    println!("{DIM}{DIVIDER}{RESET}");
    println!();
    print!("  Select a device {BOLD}{CYAN}(1-{}){RESET} or press {BOLD}{CYAN}[ENTER]{RESET} to skip: ", devices.len());
    io::stdout().flush().unwrap();

    let Some(answer) = prompt::read_line() else {
        println!();
        return;
    };

    if answer.is_empty() {
        println!("  {DIM}Skipped.{RESET}");
        println!();
        return;
    }

    let Ok(idx) = answer.parse::<usize>() else {
        eprintln!("  Invalid selection.");
        println!();
        return;
    };

    if idx < 1 || idx > devices.len() {
        eprintln!("  Selection out of range.");
        println!();
        return;
    }

    let chosen = &devices[idx - 1];
    let Some(path) = Config::config_path() else {
        println!("  Device: {}", chosen);
        println!("  {DIM}Could not determine config path to save.{RESET}");
        println!();
        return;
    };

    match FileConfig::set_value_str(&path, "device", chosen) {
        Ok(()) => {
            println!();
            println!("  {GREEN}✓{RESET}  Saved device \"{}\" to {DIM}{}{RESET}", chosen, path.display());
        }
        Err(e) => eprintln!("  {RED}✗{RESET}  Failed to save: {}", e),
    }
    println!();
}
