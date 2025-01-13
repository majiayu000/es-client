use std::sync::Arc;
use tokio::sync::Mutex;
use std::collections::HashMap;
use crate::{
    elasticsearch::client::ESClient,
    db::Database,
};

pub struct AppState {
    pub es_clients: Arc<Mutex<HashMap<String, ESClient>>>,
    pub db: Database,
}

impl AppState {
    pub fn new(db: Database) -> Self {
        Self {
            es_clients: Arc::new(Mutex::new(HashMap::new())),
            db,
        }
    }
} 