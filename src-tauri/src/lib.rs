pub mod commands;
pub mod config;
pub mod db;
pub mod elasticsearch;
pub mod error;

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use elasticsearch::client::ESClient;
use db::Database;

pub struct AppState {
    pub es_clients: Arc<Mutex<HashMap<String, ESClient>>>,
    pub db: Arc<Database>,
}

impl AppState {
    pub fn new(db: Database) -> Self {
        Self {
            es_clients: Arc::new(Mutex::new(HashMap::new())),
            db: Arc::new(db),
        }
    }
}
