use crate::{
    config::ElasticsearchConfig,
    elasticsearch::client::{
        ESClient, IndexInfo, ClusterInfo, ShardInfo, ConnectionInfo,
        SnapshotRepository, Snapshot, ClusterHealth
    },
    error::{AppError, AppResult},
    db::SavedConnection,
    AppState,
};
use serde_json::{Value, json};
use serde::Deserialize;
#[allow(unused_imports)]
use serde as _;
use tauri::State;
use chrono::Utc;
use url::Url;

#[tauri::command(async)]
pub async fn connect_elasticsearch(
    config: ElasticsearchConfig,
    connection_info: ConnectionInfo,
    state: State<'_, AppState>,
) -> AppResult<bool> {
    println!("Received connection request with config: {:?}", config);
    println!("Connection info: {:?}", connection_info);

    let client = match ESClient::new(config, connection_info).await {
        Ok(client) => {
            println!("ES client created successfully");
            client
        },
        Err(e) => {
            println!("Failed to create ES client: {:?}", e);
            return Err(e);
        }
    };

    let is_connected = match client.test_connection().await {
        Ok(result) => {
            println!("Connection test result: {}", result);
            result
        },
        Err(e) => {
            println!("Connection test failed: {:?}", e);
            return Err(e);
        }
    };
    
    if is_connected {
        println!("Connection successful, storing client in state");
        let mut es_clients = state.es_clients.lock().await;
        es_clients.insert(client.get_connection_info().id.clone(), client);
        Ok(true)
    } else {
        println!("Connection test returned false");
        Err(AppError::ConnectionError("无法连接到 Elasticsearch 服务器".to_string()))
    }
}

#[tauri::command(async)]
pub async fn disconnect_elasticsearch(
    connection_id: String,
    state: State<'_, AppState>,
) -> AppResult<bool> {
    let mut es_clients = state.es_clients.lock().await;
    es_clients.remove(&connection_id);
    Ok(true)
}

#[tauri::command(async)]
pub async fn list_connections(state: State<'_, AppState>) -> AppResult<Vec<ConnectionInfo>> {
    let es_clients = state.es_clients.lock().await;
    let connections: Vec<ConnectionInfo> = es_clients
        .values()
        .map(|client| client.get_connection_info().clone())
        .collect();
    Ok(connections)
}

#[tauri::command(async)]
pub async fn test_connection(connection_id: String, state: State<'_, AppState>) -> AppResult<bool> {
    let es_clients = state.es_clients.lock().await;
    match es_clients.get(&connection_id) {
        Some(client) => client.test_connection().await,
        None => Ok(false),
    }
}

#[tauri::command(async)]
pub async fn get_current_config(connection_id: String, state: State<'_, AppState>) -> AppResult<Option<ElasticsearchConfig>> {
    let es_clients = state.es_clients.lock().await;
    Ok(es_clients.get(&connection_id).map(|client| client.get_config().clone()))
}

#[tauri::command(async)]
pub async fn list_indices(connection_id: String, state: State<'_, AppState>) -> AppResult<Vec<IndexInfo>> {
    let es_clients = state.es_clients.lock().await;
    match es_clients.get(&connection_id) {
        Some(client) => client.list_indices().await,
        None => Err(AppError::ConnectionError("Not connected to Elasticsearch".to_string())),
    }
}

#[tauri::command(async)]
pub async fn get_cluster_info(connection_id: String, state: State<'_, AppState>) -> AppResult<ClusterInfo> {
    println!("Attempting to get cluster info for connection_id: {}", connection_id);
    let es_clients = state.es_clients.lock().await;
    println!("ES clients lock acquired");
    
    match es_clients.get(&connection_id) {
        Some(client) => {
            println!("Found client for connection_id: {}", connection_id);
            println!("Attempting to get cluster info...");
            match client.get_cluster_info().await {
                Ok(info) => {
                    println!("Successfully retrieved cluster info: {:?}", info);
                    Ok(info)
                },
                Err(e) => {
                    println!("Failed to get cluster info: {:?}", e);
                    Err(e)
                }
            }
        },
        None => {
            println!("No client found for connection_id: {}", connection_id);
            Err(AppError::ConnectionError("Not connected to Elasticsearch".to_string()))
        }
    }
}

#[tauri::command(async)]
pub async fn get_shards_info(connection_id: String, state: State<'_, AppState>) -> AppResult<Vec<ShardInfo>> {
    let es_clients = state.es_clients.lock().await;
    match es_clients.get(&connection_id) {
        Some(client) => client.get_shards_info().await,
        None => Err(AppError::ConnectionError("Not connected to Elasticsearch".to_string())),
    }
}

#[tauri::command(async)]
pub async fn search(
    connection_id: String,
    index: String,
    query: String,
    state: State<'_, AppState>,
) -> AppResult<serde_json::Value> {
    let es_clients = state.es_clients.lock().await;
    match es_clients.get(&connection_id) {
        Some(client) => {
            let mut query_json: serde_json::Value = serde_json::from_str(&query)
                .map_err(|e| AppError::ValidationError(format!("无效的查询JSON: {}", e)))?;

            if let Some(obj) = query_json.as_object_mut() {
                if !obj.contains_key("size") {
                    obj.insert("size".to_string(), json!(100));
                }
                obj.insert("track_scores".to_string(), json!(true));
            }

            let response = client
                .get_client()
                .search(elasticsearch::SearchParts::Index(&[&index]))
                .body(query_json)
                .send()
                .await
                .map_err(|e| AppError::ElasticsearchError(e.to_string()))?;

            let response_body = response
                .json::<serde_json::Value>()
                .await
                .map_err(|e| AppError::ElasticsearchError(e.to_string()))?;

            Ok(response_body)
        }
        None => Err(AppError::ConnectionError("Not connected to Elasticsearch".to_string())),
    }
}

#[tauri::command(async)]
pub async fn save_connection_info(
    connection_info: ConnectionInfo,
    config: ElasticsearchConfig,
    state: State<'_, AppState>,
) -> AppResult<()> {
    let host = config.hosts.first()
        .ok_or_else(|| AppError::ValidationError("No host provided".to_string()))?;
    let url = Url::parse(host)
        .map_err(|e| AppError::ValidationError(format!("Invalid host URL: {}", e)))?;

    let saved_conn = SavedConnection {
        id: connection_info.id.clone(),
        name: connection_info.name.clone(),
        host: url.host_str()
            .ok_or_else(|| AppError::ValidationError("Invalid host".to_string()))?
            .to_string(),
        port: url.port().unwrap_or(9200),
        username: config.username.clone(),
        password: config.password.clone(),
        created_at: Utc::now().timestamp(),
        last_used_at: Utc::now().timestamp(),
    };

    state.db.save_connection(saved_conn).await
}

#[tauri::command(async)]
pub async fn load_saved_connections(
    state: State<'_, AppState>,
) -> AppResult<Vec<SavedConnection>> {
    state.db.list_connections().await
}

#[tauri::command(async)]
pub async fn delete_saved_connection(
    id: String,
    state: State<'_, AppState>,
) -> AppResult<()> {
    state.db.delete_connection(id).await
}

#[tauri::command]
pub async fn list_snapshot_repositories(
    connection_id: String,
    state: State<'_, AppState>,
) -> Result<Vec<SnapshotRepository>, String> {
    let es_clients = state.es_clients.lock().await;
    let client = es_clients
        .get(&connection_id)
        .ok_or_else(|| "Not connected to Elasticsearch".to_string())?;
    
    client.list_snapshot_repositories()
        .await
        .map_err(|e| e.to_string())
}

#[derive(Debug, Deserialize)]
pub struct CreateRepositoryRequest {
    pub connection_id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub repository_type: String,
    pub settings: Value,
}

#[tauri::command]
pub async fn create_snapshot_repository(
    connection_id: String,
    name: String,
    r#type: String,
    settings: Value,
    state: State<'_, AppState>,
) -> Result<(), String> {
    println!("=== Create Snapshot Repository Command Started ===");
    println!("Command parameters received:");
    println!("  connection_id: {:?}", connection_id);
    println!("  name: {:?}", name);
    println!("  type: {:?}", r#type);
    println!("  settings: {:?}", settings);

    let es_clients = state.es_clients.lock().await;
    println!("ES clients lock acquired");
    
    println!("Looking for client with connection_id: {}", connection_id);
    let client = match es_clients.get(&connection_id) {
        Some(client) => {
            println!("Found ES client for connection_id: {}", connection_id);
            client
        },
        None => {
            let error = format!("No client found for connection_id: {}", connection_id);
            println!("Error: {}", error);
            return Err(error);
        }
    };
    
    println!("Attempting to create snapshot repository");
    println!("Parameters for create_snapshot_repository:");
    println!("  Name: {}", name);
    println!("  Type: {}", r#type);
    println!("  Settings: {}", settings);

    match client.create_snapshot_repository(&name, &r#type, settings).await {
        Ok(_) => {
            println!("Successfully created snapshot repository");
            println!("=== Command completed successfully ===");
            Ok(())
        }
        Err(e) => {
            let error = format!("Failed to create snapshot repository: {}", e);
            println!("Error: {}", error);
            println!("=== Command failed ===");
            Err(error)
        }
    }
}

#[tauri::command]
pub async fn list_snapshots(
    connection_id: String,
    repository: String,
    state: State<'_, AppState>,
) -> Result<Vec<Snapshot>, String> {
    let es_clients = state.es_clients.lock().await;
    let client = es_clients
        .get(&connection_id)
        .ok_or_else(|| "Not connected to Elasticsearch".to_string())?;
    
    client.list_snapshots(&repository)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_snapshot(
    connection_id: String,
    repository: String,
    snapshot: String,
    indices: Option<Vec<String>>,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let es_clients = state.es_clients.lock().await;
    let client = es_clients
        .get(&connection_id)
        .ok_or_else(|| "Not connected to Elasticsearch".to_string())?;
    
    client.create_snapshot(&repository, &snapshot, indices)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_snapshot(
    connection_id: String,
    repository: String,
    snapshot: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let es_clients = state.es_clients.lock().await;
    let client = es_clients
        .get(&connection_id)
        .ok_or_else(|| "Not connected to Elasticsearch".to_string())?;
    
    client.delete_snapshot(&repository, &snapshot)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn restore_snapshot(
    connection_id: String,
    repository: String,
    snapshot: String,
    indices: Option<Vec<String>>,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let es_clients = state.es_clients.lock().await;
    let client = es_clients
        .get(&connection_id)
        .ok_or_else(|| "Not connected to Elasticsearch".to_string())?;
    
    client.restore_snapshot(&repository, &snapshot, indices)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_cluster_health(
    connection_id: String,
    state: State<'_, AppState>,
) -> Result<ClusterHealth, String> {
    let es_clients = state.es_clients.lock().await;
    let client = es_clients
        .get(&connection_id)
        .ok_or_else(|| "Not connected to Elasticsearch".to_string())?;
    
    client.get_cluster_health()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_cluster_stats(
    connection_id: String,
    state: State<'_, AppState>,
) -> Result<Value, String> {
    let es_clients = state.es_clients.lock().await;
    let client = es_clients
        .get(&connection_id)
        .ok_or_else(|| "Not connected to Elasticsearch".to_string())?;
    
    client.get_cluster_stats()
        .await
        .map_err(|e| e.to_string())
} 