use std::io::{self, Write};

/// Read a line from stdin. Returns None if ESC was pressed or stdin closed.
pub fn read_line() -> Option<String> {
    let mut buf = String::new();
    io::stdin().read_line(&mut buf).ok()?;
    if buf.contains('\x1b') {
        return None;
    }
    Some(buf.trim().to_string())
}

/// Print a prompt and wait for Enter. Returns false if ESC was pressed.
pub fn wait_for_enter(prompt: &str) -> bool {
    print!("{}", prompt);
    io::stdout().flush().unwrap();
    read_line().is_some()
}
