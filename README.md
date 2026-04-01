*Shhh!*
=======

Get alerts when you are too loud.


About
-----

This app monitors the microphone input on your computer and plays a "SHHH!" sound when you exceed a certain decibel threshold.


Download
--------

You can find binaries in the [releases](https://github.com/jchook/shhh/releases) section.

If you have `cargo` installed, you can install it via crates.io:

```sh
cargo install shhh
```


Getting Started
---------------

Generate a default config file:

```sh
shhh init
```

Calibrate for your microphone and environment:

```sh
shhh calibrate
```

Then just run it:

```sh
shhh
```


Configuration
-------------

Settings can be passed as CLI flags, environment variables, or in a config file. CLI flags take precedence over env vars, which take precedence over the config file.

Config file locations:
- **Linux:** `~/.config/shhh/shhh.toml`
- **macOS:** `~/Library/Application Support/shhh/shhh.toml`
- **Windows:** `C:\Users\<User>\AppData\Roaming\shhh\shhh.toml`

Run `shhh --help` for all available options.

| Setting | Flag | Env Var | Default | Description |
|---------|------|---------|---------|-------------|
| `alert_frequency` | `-f` | `SHHH_ALERT_FREQUENCY` | 1 | Time between alerts (seconds) |
| `decibel_threshold` | `-t` | `SHHH_DECIBEL_THRESHOLD` | -35.0 | dB threshold for an alert |
| `sensitivity` | `-s` | `SHHH_SENSITIVITY` | 0.8 | 0 = sustained loudness, 1 = spikes |
| `notify` | `-n` | `SHHH_NOTIFY` | true | Enable system notifications |
| `verbose` | `-v` | `SHHH_VERBOSE` | 0 | Verbosity level |


License
-------

MIT.
