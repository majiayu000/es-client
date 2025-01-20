// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use elastic_eye_lib::{AppState, commands, db::Database};
use elastic_eye_lib::elasticsearch::client::IndexDetails;
use tauri::Manager;
use std::sync::Arc;

#[tokio::main]
async fn main() {
    if std::env::var("RUST_LOG").is_err() {
        std::env::set_var("RUST_LOG", "info");
    }
    tracing_subscriber::fmt::init();

    let app = tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle();
            let app_dir = app_handle.path().app_data_dir().expect("Failed to get app dir");
            std::fs::create_dir_all(&app_dir).expect("Failed to create app dir");
            let db_path = app_dir.join("connections.db");

            // 创建一个通道来传递数据库实例
            let (tx, rx) = std::sync::mpsc::channel();

            // 在新线程中初始化数据库
            std::thread::spawn(move || {
                let rt = tokio::runtime::Runtime::new().expect("Failed to create runtime");
                let db = rt.block_on(Database::new(db_path)).expect("Failed to initialize database");
                tx.send(db).expect("Failed to send database instance");
            });

            // 接收数据库实例
            let db = rx.recv().expect("Failed to receive database instance");
            app.manage(AppState::new(db));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::connect_elasticsearch,
            commands::disconnect_elasticsearch,
            commands::list_connections,
            commands::test_connection,
            commands::get_current_config,
            commands::list_indices,
            commands::get_cluster_info,
            commands::get_shards_info,
            commands::search,
            commands::save_connection_info,
            commands::load_saved_connections,
            commands::delete_saved_connection,
            commands::list_snapshot_repositories,
            commands::list_snapshots,
            commands::create_snapshot_repository,
            commands::create_snapshot,
            commands::delete_snapshot,
            commands::restore_snapshot,
            commands::get_cluster_health,
            commands::get_cluster_stats,
            get_index_details,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|_app_handle, event| match event {
        tauri::RunEvent::Exit => {
            println!("Application exiting");
        }
        _ => {}
    });
}

#[tauri::command]
async fn get_index_details(connection_id: String, index_name: String, state: tauri::State<'_, AppState>) -> Result<IndexDetails, String> {
    let es_clients = state.es_clients.lock().await;
    let client = es_clients.get(&connection_id).ok_or("Connection not found")?;
    client.get_index_details(&index_name).await.map_err(|e| e.to_string())
}
