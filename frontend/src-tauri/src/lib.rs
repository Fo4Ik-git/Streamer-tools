// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandEvent;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::default().build())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Запускаем Sidecar (наш Fastify сервер)
            let sidecar = app.shell().sidecar("core").unwrap();
            let (mut rx, _child) = sidecar.spawn().expect("Failed to spawn sidecar");

            tauri::async_runtime::spawn(async move {
                while let Some(event) = rx.recv().await {
                    match event {
                        CommandEvent::Stdout(line) => {
                            let msg = String::from_utf8_lossy(&line);
                            log::info!("[SIDECAR] {}", msg);
                        }
                        CommandEvent::Stderr(line) => {
                             let msg = String::from_utf8_lossy(&line);
                             log::error!("[SIDECAR ERROR] {}", msg);
                        }
                        _ => {}
                    }
                }
            });

            log::info!("Sidecar launched successfully!");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
