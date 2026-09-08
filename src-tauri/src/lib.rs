use std::io::{Read, Write};
use std::net::{TcpStream, ToSocketAddrs};
use std::time::Duration;

use tauri::RunEvent;
use tauri_plugin_shell::ShellExt;

fn shutdown_engine() {
    let address = match ("127.0.0.1", 8765).to_socket_addrs() {
        Ok(mut addresses) => match addresses.next() {
            Some(address) => address,
            None => return,
        },
        Err(_) => return,
    };

    let mut stream = match TcpStream::connect_timeout(&address, Duration::from_millis(750)) {
        Ok(stream) => stream,
        Err(_) => return,
    };

    let _ = stream.set_read_timeout(Some(Duration::from_millis(1000)));
    let request = b"POST /api/shutdown HTTP/1.1\r\nHost: 127.0.0.1:8765\r\nContent-Length: 0\r\nConnection: close\r\n\r\n";
    let _ = stream.write_all(request);
    let mut response = [0u8; 512];
    let _ = stream.read(&mut response);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let handle = app.handle().clone();

            tauri::async_runtime::spawn(async move {
                match handle.shell().sidecar("brainbox-engine") {
                    Ok(command) => {
                        match command.spawn() {
                            Ok((_rx, _child)) => {
                                eprintln!("Brainbox engine sidecar started");
                            }
                            Err(err) => {
                                eprintln!("Failed to start Brainbox engine: {err}");
                            }
                        }
                    }
                    Err(err) => {
                        eprintln!("Failed to prepare Brainbox engine sidecar: {err}");
                    }
                }
            });

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building Brainbox Firefox Manager")
        .run(|_app_handle, event| {
            if matches!(event, RunEvent::ExitRequested { .. }) {
                shutdown_engine();
            }
        });
}
