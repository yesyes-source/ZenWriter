#[tauri::command]
fn save_file_dialog(content: String) -> Result<String, String> {
    let file = rfd::FileDialog::new()
        .add_filter("Markdown (*.md)", &["md"])
        .add_filter("Text (*.txt)", &["txt"])
        .set_file_name("nota.md")
        .save_file();
    
    if let Some(path) = file {
        std::fs::write(&path, content).map_err(|e| e.to_string())?;
        Ok(path.to_string_lossy().to_string())
    } else {
        Err("Cancelled".to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![save_file_dialog])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
