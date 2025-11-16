use serde_json::{json, Value};
use std::fs;
use std::path::Path;

fn main() {
    // Sync version from package.json to tauri.conf.json
    sync_version();

    tauri_build::build()
}

fn sync_version() {
    let package_json_path = Path::new("../package.json");
    let tauri_conf_path = Path::new("tauri.conf.json");

    // Read package.json
    if let Ok(package_content) = fs::read_to_string(package_json_path) {
        if let Ok(package_data) = serde_json::from_str::<Value>(&package_content) {
            if let Some(version) = package_data.get("version").and_then(|v| v.as_str()) {
                // Read tauri.conf.json
                if let Ok(tauri_content) = fs::read_to_string(tauri_conf_path) {
                    if let Ok(mut tauri_data) = serde_json::from_str::<Value>(&tauri_content) {
                        // Update version if different
                        if tauri_data.get("version").and_then(|v| v.as_str()) != Some(version) {
                            tauri_data["version"] = json!(version);

                            // Write back with formatting
                            if let Ok(updated_content) = serde_json::to_string_pretty(&tauri_data) {
                                let _ = fs::write(tauri_conf_path, updated_content);
                                println!(
                                    "cargo:warning=Updated tauri.conf.json version to {}",
                                    version
                                );
                            }
                        }
                    }
                }
            }
        }
    }
}
