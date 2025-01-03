use serde::{Deserialize, Serialize};
use crate::error::{AppError, AppResult};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ElasticsearchConfig {
    pub hosts: Vec<String>,
    pub username: Option<String>,
    pub password: Option<String>,
    pub api_key: Option<String>,
    pub ca_cert_path: Option<String>,
    pub timeout_secs: Option<u64>,
}

impl Default for ElasticsearchConfig {
    fn default() -> Self {
        Self {
            hosts: vec!["http://localhost:9200".to_string()],
            username: None,
            password: None,
            api_key: None,
            ca_cert_path: None,
            timeout_secs: Some(30),
        }
    }
}

impl ElasticsearchConfig {
    pub fn validate(&self) -> AppResult<()> {
        if self.hosts.is_empty() {
            return Err(AppError::ValidationError("No Elasticsearch hosts provided".to_string()));
        }

        for host in &self.hosts {
            if !host.starts_with("http://") && !host.starts_with("https://") {
                return Err(AppError::ValidationError(
                    format!("Invalid host URL: {}. Must start with http:// or https://", host)
                ));
            }
        }

        Ok(())
    }
} 