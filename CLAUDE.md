# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Shhh! is a CLI tool that monitors microphone input and alerts (sound + system notification) when noise exceeds a configurable decibel threshold. Cross-platform: Linux, macOS, Windows.

## Build & Run

```bash
cargo build              # dev build
cargo build --release    # release build
cargo run                # run with defaults
cargo run -- --help      # show CLI options
cargo run -- calibrate   # interactive threshold calibration
cargo fmt                # format code (always run before committing)
cargo test               # run tests
```

Linux requires system audio libs: `sudo apt install libasound2-dev pkg-config`

## Architecture

The app has two modes: **monitor** (default) and **calibrate** (subcommand).

**Config resolution** (`config.rs`): Three-layer config with precedence CLI args > env vars > TOML file > defaults. `CliArgs` (clap derive) handles CLI+env as one layer. `FileConfig` handles the TOML file at the platform-appropriate path via `directories` crate. `Config` is the resolved public struct — the only thing the rest of the app sees.

**Audio pipeline** (`main.rs`, `loudness.rs`): CPAL input stream calls back with audio buffers. `compute_loudness()` in `loudness.rs` is the single source of truth for the RMS/peak/hybrid/dB calculation. The callback must stay non-blocking — alert playback and notifications are spawned on separate threads.

**Calibration** (`calibrate.rs`): Interactive two-phase measurement (ambient then speech) with real-time ANSI level meter. Can write results directly to the TOML config file.

## Key Constraints

- The CPAL audio callback runs on a real-time thread. Never block it with I/O, playback, or allocations.
- The alert sound (`assets/alert.ogg`) is embedded in the binary via `include_bytes!`.
- `compute_loudness()` in `loudness.rs` must be the single implementation — don't duplicate the math elsewhere.
- Sensitivity must be clamped to 0.0–1.0; values outside that range produce nonsensical hybrid metrics.
- Releases are triggered by pushing a `v*` tag. The CI matrix builds for Linux, macOS, and Windows.
