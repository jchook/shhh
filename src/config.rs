use clap::{Parser, Subcommand};
use directories::ProjectDirs;
use serde::{Deserialize, Serialize};
use std::fs;
use std::io;
use std::path::PathBuf;

const DEFAULT_ALERT_FREQUENCY: u64 = 1;
const DEFAULT_DECIBEL_THRESHOLD: f32 = -35.0;
const DEFAULT_SENSITIVITY: f32 = 0.8;

/// Shhh! Get alerts when you are too loud.
#[derive(Parser)]
#[command(version, about)]
struct CliArgs {
    /// Seconds between successive alerts
    #[arg(short = 'f', long, env = "SHHH_ALERT_FREQUENCY")]
    alert_frequency: Option<u64>,

    /// Decibel threshold to trigger alert
    #[arg(short = 't', long, env = "SHHH_DECIBEL_THRESHOLD")]
    decibel_threshold: Option<f32>,

    /// Sensitivity (0.0 = pure RMS, 1.0 = pure peak)
    #[arg(short, long, env = "SHHH_SENSITIVITY")]
    sensitivity: Option<f32>,

    /// Enable system notifications
    #[arg(short, long, env = "SHHH_NOTIFY")]
    notify: Option<bool>,

    /// Verbosity level
    #[arg(short, long, env = "SHHH_VERBOSE")]
    verbose: Option<i32>,

    #[command(subcommand)]
    pub command: Option<Command>,
}

#[derive(Subcommand)]
pub enum Command {
    /// Listen to your environment and suggest a threshold
    Calibrate {
        /// Seconds to listen during each phase
        #[arg(short, long, default_value = "3")]
        duration: u64,
    },
}

/// Settings that can be specified in a TOML config file.
/// All fields are optional so partial configs are valid.
#[derive(Deserialize, Serialize, Default)]
pub struct FileConfig {
    pub alert_frequency: Option<u64>,
    pub decibel_threshold: Option<f32>,
    pub sensitivity: Option<f32>,
    pub notify: Option<bool>,
    pub verbose: Option<i32>,
}

/// Resolved configuration exposed to the rest of the app.
/// Precedence: CLI args > env vars > config file > defaults.
#[derive(Clone, Copy)]
pub struct Config {
    pub alert_frequency: u64,
    pub decibel_threshold: f32,
    pub sensitivity: f32,
    pub notify: bool,
    pub verbose: i32,
}

impl Config {
    pub fn load() -> (Self, Option<Command>) {
        let cli = CliArgs::parse();
        let file = Self::load_file();

        let sensitivity = cli
            .sensitivity
            .or(file.sensitivity)
            .unwrap_or(DEFAULT_SENSITIVITY);

        if !(0.0..=1.0).contains(&sensitivity) {
            eprintln!(
                "Warning: sensitivity={} is outside 0.0–1.0, clamping",
                sensitivity
            );
        }

        let config = Self {
            alert_frequency: cli
                .alert_frequency
                .or(file.alert_frequency)
                .unwrap_or(DEFAULT_ALERT_FREQUENCY),
            decibel_threshold: cli
                .decibel_threshold
                .or(file.decibel_threshold)
                .unwrap_or(DEFAULT_DECIBEL_THRESHOLD),
            sensitivity: sensitivity.clamp(0.0, 1.0),
            notify: cli.notify.or(file.notify).unwrap_or(true),
            verbose: cli.verbose.or(file.verbose).unwrap_or(0),
        };

        (config, cli.command)
    }

    pub fn config_path() -> Option<PathBuf> {
        ProjectDirs::from("", "", "shhh").map(|dirs| dirs.config_dir().join("shhh.toml"))
    }

    fn load_file() -> FileConfig {
        Self::config_path()
            .and_then(|p| FileConfig::load(&p))
            .unwrap_or_default()
    }
}

impl FileConfig {
    pub fn load(path: &PathBuf) -> Option<Self> {
        let contents = match fs::read_to_string(path) {
            Ok(c) => c,
            Err(_) => return None,
        };
        match toml::from_str(&contents) {
            Ok(cfg) => Some(cfg),
            Err(e) => {
                eprintln!("Warning: failed to parse {}: {}", path.display(), e);
                None
            }
        }
    }

    pub fn save(&self, path: &PathBuf) -> io::Result<()> {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        let contents = toml::to_string_pretty(self)
            .expect("Failed to serialize config");
        fs::write(path, contents)
    }
}
