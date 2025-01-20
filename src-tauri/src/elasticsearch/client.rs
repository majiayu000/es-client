use elasticsearch::{
    Elasticsearch,
    http::transport::Transport,
    cat::CatIndicesParts,
    cluster::{ClusterHealthParts, ClusterStatsParts},
    nodes::NodesInfoParts,
    snapshot::{
        SnapshotGetRepositoryParts, SnapshotGetParts,
        SnapshotCreateRepositoryParts, SnapshotCreateParts,
        SnapshotDeleteParts, SnapshotRestoreParts
    },
    params::Bytes,
    Error,
};
use serde_json::{Value, json};
use crate::{
    config::ElasticsearchConfig,
    error::{AppError, AppResult},
};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct IndexInfo {
    pub name: String,
    pub docs_count: i64,
    pub size_in_bytes: i64,
    pub health: String,
    pub status: String,
    pub uuid: String,
    pub creation_date: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ClusterInfo {
    pub name: String,
    pub status: String,
    pub number_of_nodes: i64,
    pub active_primary_shards: i64,
    pub active_shards: i64,
    pub relocating_shards: i64,
    pub initializing_shards: i64,
    pub unassigned_shards: i64,
    pub version: String,
    pub nodes: Vec<NodeInfo>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NodeInfo {
    pub name: String,
    pub version: String,
    pub roles: Vec<String>,
    pub os: String,
    pub jvm: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ShardInfo {
    pub index: String,
    pub shard: i64,
    pub prirep: String,
    pub state: String,
    pub docs: Option<i64>,
    pub store: Option<String>,
    pub node: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ConnectionInfo {
    pub id: String,
    pub name: String,
    pub hosts: Vec<String>,
    pub is_active: bool,
}

#[derive(Debug, Serialize)]
pub struct SnapshotRepository {
    pub name: String,
    pub type_: String,
    pub settings: Value,
}

#[derive(Debug, Serialize)]
pub struct Snapshot {
    pub snapshot: String,
    pub state: String,
    pub start_time: String,
    pub end_time: Option<String>,
    pub duration_in_millis: Option<i64>,
    pub indices: Vec<String>,
    pub shards: SnapshotShards,
}

#[derive(Debug, Serialize)]
pub struct SnapshotShards {
    pub total: i32,
    pub failed: i32,
    pub successful: i32,
}

#[derive(Debug, Serialize)]
pub struct ClusterHealth {
    pub cluster_name: String,
    pub status: String,
    pub number_of_nodes: i32,
    pub number_of_data_nodes: i32,
    pub active_primary_shards: i32,
    pub active_shards: i32,
    pub relocating_shards: i32,
    pub initializing_shards: i32,
    pub unassigned_shards: i32,
    pub delayed_unassigned_shards: i32,
    pub number_of_pending_tasks: i32,
    pub number_of_in_flight_fetch: i32,
    pub task_max_waiting_in_queue_millis: i64,
    pub active_shards_percent_as_number: f64,
}

#[derive(Clone)]
pub struct ESClient {
    client: Elasticsearch,
    config: ElasticsearchConfig,
    connection_info: ConnectionInfo,
}

impl ESClient {
    pub async fn new(config: ElasticsearchConfig, connection_info: ConnectionInfo) -> AppResult<Self> {
        println!("Attempting to create new ES client with config: {:?}", config);
        
        config.validate()?;
        println!("Config validation passed");

        let hosts: Vec<&str> = config.hosts.iter().map(|s| s.as_str()).collect();
        println!("Using hosts: {:?}", hosts);
        
        let transport = if hosts.len() == 1 {
            println!("Creating single node transport");
            Transport::single_node(hosts[0])
        } else {
            println!("Creating multi-node transport");
            Transport::static_node_list(hosts)
        }.map_err(|e| {
            println!("Transport creation failed: {}", e);
            AppError::ConnectionError(format!(
                "传输层错误: {}. 详细信息: {:?}", 
                e.to_string(),
                e
            ))
        })?;

        println!("Transport created successfully");
        let client = Elasticsearch::new(transport);
        
        match client.ping().send().await {
            Ok(_) => {
                println!("Ping successful, connection established");
                Ok(Self { client, config, connection_info })
            },
            Err(e) => {
                println!("Ping failed: {}", e);
                Err(AppError::ConnectionError(format!(
                    "无法连接到 Elasticsearch: {}。\n详细错误: {:?}\n请检查:\n1. 服务器地址是否正确\n2. Elasticsearch 是否正在运行\n3. 网络连接是否正常",
                    e.to_string(),
                    e
                )))
            }
        }
    }

    pub fn get_connection_info(&self) -> &ConnectionInfo {
        &self.connection_info
    }

    pub async fn test_connection(&self) -> AppResult<bool> {
        println!("Testing connection to: {:?}", self.config.hosts);
        match self.client.ping().send().await {
            Ok(_) => {
                println!("Connection test successful");
                Ok(true)
            },
            Err(e) => {
                println!("Connection test failed: {}", e);
                Err(AppError::ConnectionError(format!(
                    "连接测试失败: {}。详细信息: {:?}",
                    e.to_string(),
                    e
                )))
            }
        }
    }

    pub fn get_client(&self) -> &Elasticsearch {
        &self.client
    }

    pub fn get_config(&self) -> &ElasticsearchConfig {
        &self.config
    }

    pub async fn list_indices(&self) -> AppResult<Vec<IndexInfo>> {
        let response = self.client
            .cat()
            .indices(CatIndicesParts::None)
            .format("json")
            .v(true)
            .bytes(Bytes::B)
            .send()
            .await
            .map_err(|e| AppError::ElasticsearchError(e.to_string()))?;

        let indices: Vec<serde_json::Value> = response.json()
            .await
            .map_err(|e| AppError::ElasticsearchError(e.to_string()))?;

        let index_infos = indices.into_iter()
            .map(|index| {
                IndexInfo {
                    name: index["index"].as_str().unwrap_or_default().to_string(),
                    docs_count: index["docs.count"].as_str()
                        .and_then(|s| s.parse::<i64>().ok())
                        .unwrap_or(0),
                    size_in_bytes: index["store.size"].as_str()
                        .and_then(|s| s.parse::<i64>().ok())
                        .unwrap_or(0),
                    health: index["health"].as_str()
                        .unwrap_or("unknown").to_string(),
                    status: index["status"].as_str()
                        .unwrap_or("unknown").to_string(),
                    uuid: index["uuid"].as_str()
                        .unwrap_or("unknown").to_string(),
                    creation_date: index["creation.date"].as_str()
                        .unwrap_or("0").to_string(),
                }
            })
            .collect();

        Ok(index_infos)
    }

    pub async fn get_cluster_info(&self) -> AppResult<ClusterInfo> {
        println!("Starting to fetch cluster info");
        // Get cluster health
        println!("Fetching cluster health...");
        let health = match self.client
            .cluster()
            .health(ClusterHealthParts::None)
            .send()
            .await {
                Ok(response) => {
                    println!("Successfully received health response");
                    response
                },
                Err(e) => {
                    println!("Failed to get cluster health: {:?}", e);
                    return Err(AppError::ElasticsearchError(e.to_string()));
                }
            };

        let health_response = match health.json::<serde_json::Value>().await {
            Ok(json) => {
                println!("Successfully parsed health response: {:?}", json);
                json
            },
            Err(e) => {
                println!("Failed to parse health response: {:?}", e);
                return Err(AppError::ElasticsearchError(e.to_string()));
            }
        };

        // Get nodes info
        println!("Fetching nodes info...");
        let nodes = match self.client
            .nodes()
            .info(NodesInfoParts::None)
            .send()
            .await {
                Ok(response) => {
                    println!("Successfully received nodes response");
                    response
                },
                Err(e) => {
                    println!("Failed to get nodes info: {:?}", e);
                    return Err(AppError::ElasticsearchError(e.to_string()));
                }
            };

        let nodes_response = match nodes.json::<serde_json::Value>().await {
            Ok(json) => {
                println!("Successfully parsed nodes response: {:?}", json);
                json
            },
            Err(e) => {
                println!("Failed to parse nodes response: {:?}", e);
                return Err(AppError::ElasticsearchError(e.to_string()));
            }
        };

        // Extract node information
        println!("Extracting node information...");
        let mut node_infos = Vec::new();
        if let Some(nodes) = nodes_response["nodes"].as_object() {
            for (_id, node) in nodes {
                let node_info = NodeInfo {
                    name: node["name"].as_str().unwrap_or("unknown").to_string(),
                    version: node["version"].as_str().unwrap_or("unknown").to_string(),
                    roles: node["roles"]
                        .as_array()
                        .map(|roles| {
                            roles
                                .iter()
                                .filter_map(|role| role.as_str().map(String::from))
                                .collect()
                        })
                        .unwrap_or_default(),
                    os: format!(
                        "{} {}",
                        node["os"]["name"].as_str().unwrap_or("unknown"),
                        node["os"]["version"].as_str().unwrap_or("")
                    ),
                    jvm: format!(
                        "{} ({})",
                        node["jvm"]["vm_name"].as_str().unwrap_or("unknown"),
                        node["jvm"]["version"].as_str().unwrap_or("unknown")
                    ),
                };
                node_infos.push(node_info);
            }
        }

        println!("Successfully extracted node information");
        println!("Creating final cluster info response");

        Ok(ClusterInfo {
            name: nodes_response["cluster_name"].as_str().unwrap_or("unknown").to_string(),
            status: health_response["status"].as_str().unwrap_or("unknown").to_string(),
            number_of_nodes: health_response["number_of_nodes"].as_i64().unwrap_or(0),
            active_primary_shards: health_response["active_primary_shards"].as_i64().unwrap_or(0),
            active_shards: health_response["active_shards"].as_i64().unwrap_or(0),
            relocating_shards: health_response["relocating_shards"].as_i64().unwrap_or(0),
            initializing_shards: health_response["initializing_shards"].as_i64().unwrap_or(0),
            unassigned_shards: health_response["unassigned_shards"].as_i64().unwrap_or(0),
            version: nodes_response["nodes"]
                .as_object()
                .and_then(|nodes| nodes.values().next())
                .and_then(|node| node["version"].as_str())
                .unwrap_or("unknown")
                .to_string(),
            nodes: node_infos,
        })
    }

    pub async fn get_shards_info(&self) -> AppResult<Vec<ShardInfo>> {
        let response = self.client
            .cat()
            .shards(elasticsearch::cat::CatShardsParts::None)
            .format("json")
            .send()
            .await
            .map_err(|e| AppError::ElasticsearchError(e.to_string()))?;

        let shards: Vec<serde_json::Value> = response.json()
            .await
            .map_err(|e| AppError::ElasticsearchError(e.to_string()))?;

        let shard_infos = shards.into_iter()
            .map(|shard| {
                ShardInfo {
                    index: shard["index"].as_str().unwrap_or_default().to_string(),
                    shard: shard["shard"].as_str()
                        .and_then(|s| s.parse::<i64>().ok())
                        .unwrap_or_default(),
                    prirep: shard["prirep"].as_str().unwrap_or_default().to_string(),
                    state: shard["state"].as_str().unwrap_or_default().to_string(),
                    docs: shard["docs"].as_str()
                        .and_then(|s| s.parse::<i64>().ok()),
                    store: shard["store"].as_str()
                        .map(|s| s.to_string()),
                    node: shard["node"].as_str()
                        .map(|s| s.to_string()),
                }
            })
            .collect();

        Ok(shard_infos)
    }

    pub async fn list_snapshot_repositories(&self) -> Result<Vec<SnapshotRepository>, Error> {
        let response = self.client
            .snapshot()
            .get_repository(SnapshotGetRepositoryParts::None)
            .send()
            .await?;

        let repositories = response.json::<Value>().await?;
        let mut result = Vec::new();

        if let Value::Object(repos) = repositories {
            for (name, details) in repos {
                if let Value::Object(repo_details) = details {
                    let type_ = repo_details.get("type").and_then(|t| t.as_str()).unwrap_or("unknown").to_string();
                    let settings = repo_details.get("settings").cloned().unwrap_or(Value::Null);
                    result.push(SnapshotRepository {
                        name,
                        type_,
                        settings,
                    });
                }
            }
        }

        Ok(result)
    }

    pub async fn list_snapshots(&self, repository: &str) -> Result<Vec<Snapshot>, Error> {
        let response = self.client
            .snapshot()
            .get(SnapshotGetParts::RepositorySnapshot(repository, &["_all"]))
            .send()
            .await?;

        let snapshots = response.json::<Value>().await?;
        let mut result = Vec::new();

        if let Some(snapshots_array) = snapshots.get("snapshots").and_then(|s| s.as_array()) {
            for snapshot in snapshots_array {
                if let Some(obj) = snapshot.as_object() {
                    let shards = obj.get("shards")
                        .and_then(|s| s.as_object())
                        .map(|s| s.to_owned())
                        .unwrap_or_default();
                    result.push(Snapshot {
                        snapshot: obj.get("snapshot").and_then(|s| s.as_str()).unwrap_or("").to_string(),
                        state: obj.get("state").and_then(|s| s.as_str()).unwrap_or("").to_string(),
                        start_time: obj.get("start_time").and_then(|s| s.as_str()).unwrap_or("").to_string(),
                        end_time: obj.get("end_time").and_then(|s| s.as_str()).map(|s| s.to_string()),
                        duration_in_millis: obj.get("duration_in_millis").and_then(|d| d.as_i64()),
                        indices: obj.get("indices").and_then(|i| i.as_array())
                            .map(|arr| arr.iter().filter_map(|v| v.as_str().map(|s| s.to_string())).collect())
                            .unwrap_or_default(),
                        shards: SnapshotShards {
                            total: shards.get("total").and_then(|t| t.as_i64()).unwrap_or(0) as i32,
                            failed: shards.get("failed").and_then(|f| f.as_i64()).unwrap_or(0) as i32,
                            successful: shards.get("successful").and_then(|s| s.as_i64()).unwrap_or(0) as i32,
                        },
                    });
                }
            }
        }

        Ok(result)
    }

    pub async fn create_snapshot_repository(
        &self,
        name: &str,
        type_: &str,
        settings: Value,
    ) -> Result<(), Error> {
        let body = json!({
            "type": type_,
            "settings": settings
        });

        self.client
            .snapshot()
            .create_repository(SnapshotCreateRepositoryParts::Repository(name))
            .body(body)
            .send()
            .await?;

        Ok(())
    }

    pub async fn create_snapshot(
        &self,
        repository: &str,
        snapshot: &str,
        indices: Option<Vec<String>>,
    ) -> Result<(), Error> {
        let mut body = json!({
            "ignore_unavailable": true,
            "include_global_state": false
        });

        if let Some(idx) = indices {
            body.as_object_mut().unwrap().insert("indices".to_string(), json!(idx));
        }

        self.client
            .snapshot()
            .create(SnapshotCreateParts::RepositorySnapshot(repository, snapshot))
            .body(body)
            .wait_for_completion(false)
            .send()
            .await?;

        Ok(())
    }

    pub async fn delete_snapshot(
        &self,
        repository: &str,
        snapshot: &str,
    ) -> Result<(), Error> {
        self.client
            .snapshot()
            .delete(SnapshotDeleteParts::RepositorySnapshot(repository, &[snapshot]))
            .send()
            .await?;

        Ok(())
    }

    pub async fn restore_snapshot(
        &self,
        repository: &str,
        snapshot: &str,
        indices: Option<Vec<String>>,
    ) -> Result<(), Error> {
        let mut body = json!({
            "ignore_unavailable": true,
            "include_global_state": false
        });

        if let Some(idx) = indices {
            body.as_object_mut().unwrap().insert("indices".to_string(), json!(idx));
        }

        self.client
            .snapshot()
            .restore(SnapshotRestoreParts::RepositorySnapshot(repository, snapshot))
            .body(body)
            .wait_for_completion(false)
            .send()
            .await?;

        Ok(())
    }

    pub async fn get_cluster_health(&self) -> Result<ClusterHealth, Error> {
        let response = self.client
            .cluster()
            .health(elasticsearch::cluster::ClusterHealthParts::None)
            .send()
            .await?;

        let health = response.json::<Value>().await?;
        
        Ok(ClusterHealth {
            cluster_name: health["cluster_name"].as_str().unwrap_or("").to_string(),
            status: health["status"].as_str().unwrap_or("").to_string(),
            number_of_nodes: health["number_of_nodes"].as_i64().unwrap_or(0) as i32,
            number_of_data_nodes: health["number_of_data_nodes"].as_i64().unwrap_or(0) as i32,
            active_primary_shards: health["active_primary_shards"].as_i64().unwrap_or(0) as i32,
            active_shards: health["active_shards"].as_i64().unwrap_or(0) as i32,
            relocating_shards: health["relocating_shards"].as_i64().unwrap_or(0) as i32,
            initializing_shards: health["initializing_shards"].as_i64().unwrap_or(0) as i32,
            unassigned_shards: health["unassigned_shards"].as_i64().unwrap_or(0) as i32,
            delayed_unassigned_shards: health["delayed_unassigned_shards"].as_i64().unwrap_or(0) as i32,
            number_of_pending_tasks: health["number_of_pending_tasks"].as_i64().unwrap_or(0) as i32,
            number_of_in_flight_fetch: health["number_of_in_flight_fetch"].as_i64().unwrap_or(0) as i32,
            task_max_waiting_in_queue_millis: health["task_max_waiting_in_queue_millis"].as_i64().unwrap_or(0),
            active_shards_percent_as_number: health["active_shards_percent_as_number"].as_f64().unwrap_or(0.0),
        })
    }

    pub async fn get_cluster_stats(&self) -> Result<Value, Error> {
        let response = self.client
            .cluster()
            .stats(elasticsearch::cluster::ClusterStatsParts::None)
            .send()
            .await?;

        response.json::<Value>().await.map_err(Error::from)
    }
} 