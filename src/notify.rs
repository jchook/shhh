use notify_rust::Notification;

pub fn send_system_notification() {
    if let Err(e) = Notification::new()
        .summary("Shhh")
        .body("Please be quiet, you are too loud!")
        .show()
    {
        eprintln!("Failed to send notification: {}", e);
    }
}
