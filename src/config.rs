use clap::{Parser, Subcommand};
use directories::ProjectDirs;
use serde::Deserialize;
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

    /// Input device name (substring match)
    #[arg(short, long, env = "SHHH_DEVICE")]
    device: Option<String>,

    /// Path to custom alert sound (WAV, FLAC, OGG, MP3)
    #[arg(short, long, env = "SHHH_ALERT")]
    alert: Option<String>,

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
    /// Create a default config file
    Init,
    /// List available input devices
    Devices {
        /// Show all devices (including low-level ALSA variants)
        #[arg(short, long)]
        verbose: bool,
    },
}

/// Settings that can be specified in a TOML config file.
/// All fields are optional so partial configs are valid.
#[derive(Deserialize, Default)]
pub struct FileConfig {
    pub alert_frequency: Option<u64>,
    pub decibel_threshold: Option<f32>,
    pub sensitivity: Option<f32>,
    pub notify: Option<bool>,
    pub verbose: Option<i32>,
    pub device: Option<String>,
    pub alert: Option<String>,
}

/// Resolved configuration exposed to the rest of the app.
/// Precedence: CLI args > env vars > config file > defaults.
#[derive(Clone)]
pub struct Config {
    pub alert_frequency: u64,
    pub decibel_threshold: f32,
    pub sensitivity: f32,
    pub notify: bool,
    pub verbose: i32,
    pub device: Option<String>,
    pub alert: Option<String>,
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
            device: cli.device.or(file.device),
            alert: cli.alert.or(file.alert),
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

const DEFAULT_CONFIG: &str = include_str!("../etc/config.default.toml");

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

    /// Initialize a default config file. Returns Err if it already exists.
    pub fn init(path: &PathBuf) -> io::Result<()> {
        if path.exists() {
            return Err(io::Error::new(
                io::ErrorKind::AlreadyExists,
                format!("{} already exists", path.display()),
            ));
        }
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        fs::write(path, DEFAULT_CONFIG)
    }

    /// Update a single key in the config file, preserving comments and formatting.
    /// If the file doesn't exist, creates one from the default template first.
    pub fn set_value(path: &PathBuf, key: &str, value: f32) -> io::Result<()> {
        Self::set_raw(path, key, toml_edit::value(value as f64))
    }

    pub fn set_value_str(path: &PathBuf, key: &str, value: &str) -> io::Result<()> {
        Self::set_raw(path, key, toml_edit::value(value))
    }

    fn set_raw(path: &PathBuf, key: &str, item: toml_edit::Item) -> io::Result<()> {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        let contents = fs::read_to_string(path).unwrap_or_else(|_| DEFAULT_CONFIG.to_string());
        let mut doc = contents
            .parse::<toml_edit::DocumentMut>()
            .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e))?;
        doc[key] = item;
        fs::write(path, doc.to_string())
    }
}
