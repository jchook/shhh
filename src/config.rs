use clap::Parser;
use directories::ProjectDirs;
use serde::Deserialize;
use std::fs;
use std::path::PathBuf;

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
}

/// Settings that can be specified in a TOML config file.
/// All fields are optional so partial configs are valid.
#[derive(Deserialize, Default)]
struct FileConfig {
    alert_frequency: Option<u64>,
    decibel_threshold: Option<f32>,
    sensitivity: Option<f32>,
    notify: Option<bool>,
    verbose: Option<i32>,
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
    pub fn load() -> Self {
        let cli = CliArgs::parse();
        let file = Self::load_file();

        let sensitivity = cli
            .sensitivity
            .or(file.sensitivity)
            .unwrap_or(0.8);

        if !(0.0..=1.0).contains(&sensitivity) {
            eprintln!(
                "Warning: sensitivity={} is outside 0.0–1.0, clamping",
                sensitivity
            );
        }

        Self {
            alert_frequency: cli.alert_frequency.or(file.alert_frequency).unwrap_or(1),
            decibel_threshold: cli
                .decibel_threshold
                .or(file.decibel_threshold)
                .unwrap_or(-10.0),
            sensitivity: sensitivity.clamp(0.0, 1.0),
            notify: cli.notify.or(file.notify).unwrap_or(true),
            verbose: cli.verbose.or(file.verbose).unwrap_or(0),
        }
    }

    fn config_path() -> Option<PathBuf> {
        ProjectDirs::from("", "", "shhh").map(|dirs| dirs.config_dir().join("shhh.toml"))
    }

    fn load_file() -> FileConfig {
        let Some(path) = Self::config_path() else {
            return FileConfig::default();
        };
        let Ok(contents) = fs::read_to_string(&path) else {
            return FileConfig::default();
        };
        match toml::from_str(&contents) {
            Ok(cfg) => cfg,
            Err(e) => {
                eprintln!("Warning: failed to parse {}: {}", path.display(), e);
                FileConfig::default()
            }
        }
    }
}
