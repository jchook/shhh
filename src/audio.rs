use cpal::traits::{DeviceTrait, HostTrait};

pub fn get_input_device(host: &cpal::Host, name: Option<&str>) -> cpal::Device {
    match name {
        None => host
            .default_input_device()
            .expect("No input device available"),
        Some(query) => {
            let query_lower = query.to_lowercase();
            let devices = host.input_devices().expect("Failed to enumerate devices");
            devices
                .into_iter()
                .find(|d| {
                    d.name()
                        .map(|n| n.to_lowercase().contains(&query_lower))
                        .unwrap_or(false)
                })
                .unwrap_or_else(|| {
                    eprintln!("No input device matching \"{}\"", query);
                    std::process::exit(1);
                })
        }
    }
}
