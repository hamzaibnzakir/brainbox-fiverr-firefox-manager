use tauri::Manager;
use tauri_plugin_shell::ShellExt;

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
        .run(tauri::generate_context!())
        .expect("error while running Brainbox Firefox Manager");
}