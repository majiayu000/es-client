use elasticsearch::{
    Elasticsearch,
    http::transport::Transport,
    cat::CatIndicesParts,
    cluster::ClusterHealthParts,
    nodes::NodesInfoParts,
    params::Bytes,
};
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
        // Get cluster health
        let health = self.client
            .cluster()
            .health(ClusterHealthParts::None)
            .send()
            .await
            .map_err(|e| AppError::ElasticsearchError(e.to_string()))?;

        let health_response = health.json::<serde_json::Value>()
            .await
            .map_err(|e| AppError::ElasticsearchError(e.to_string()))?;

        // Get nodes info
        let nodes = self.client
            .nodes()
            .info(NodesInfoParts::None)
            .send()
            .await
            .map_err(|e| AppError::ElasticsearchError(e.to_string()))?;

        let nodes_response = nodes.json::<serde_json::Value>()
            .await
            .map_err(|e| AppError::ElasticsearchError(e.to_string()))?;

        let mut node_infos = Vec::new();
        if let Some(nodes_obj) = nodes_response["nodes"].as_object() {
            for (_id, node) in nodes_obj {
                node_infos.push(NodeInfo {
                    name: node["name"].as_str().unwrap_or("unknown").to_string(),
                    version: node["version"].as_str().unwrap_or("unknown").to_string(),
                    roles: node["roles"]
                        .as_array()
                        .map(|r| r.iter().filter_map(|v| v.as_str().map(String::from)).collect())
                        .unwrap_or_default(),
                    os: format!(
                        "{} {} ({})",
                        node["os"]["name"].as_str().unwrap_or("unknown"),
                        node["os"]["version"].as_str().unwrap_or(""),
                        node["os"]["arch"].as_str().unwrap_or("")
                    ),
                    jvm: format!(
                        "{} ({})",
                        node["jvm"]["version"].as_str().unwrap_or("unknown"),
                        node["jvm"]["vm_name"].as_str().unwrap_or("")
                    ),
                });
            }
        }

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
} 