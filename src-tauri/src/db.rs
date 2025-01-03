use crate::error::{AppError, AppResult};
use rusqlite::params;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tokio_rusqlite::Connection as AsyncConnection;

#[derive(Debug, Serialize, Deserialize)]
pub struct SavedConnection {
    pub id: String,
    pub name: String,
    pub host: String,
    pub port: u16,
    pub username: Option<String>,
    pub password: Option<String>,
    pub created_at: i64,
    pub last_used_at: i64,
}

pub struct Database {
    conn: AsyncConnection,
}

impl Database {
    pub async fn new(path: PathBuf) -> AppResult<Self> {
        let conn = AsyncConnection::open(path)
            .await
            .map_err(|e| AppError::StateError(format!("Failed to open database: {}", e)))?;

        conn.call(|conn| {
            conn.execute(
                "CREATE TABLE IF NOT EXISTS connections (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    host TEXT NOT NULL,
                    port INTEGER NOT NULL,
                    username TEXT,
                    password TEXT,
                    created_at INTEGER NOT NULL,
                    last_used_at INTEGER NOT NULL
                )",
                [],
            )
        })
        .await
        .map_err(|e| AppError::StateError(format!("Failed to create table: {}", e)))?;

        Ok(Database { conn })
    }

    pub async fn save_connection(&self, connection: SavedConnection) -> AppResult<()> {
        self.conn
            .call(move |conn| {
                conn.execute(
                    "INSERT OR REPLACE INTO connections (
                        id, name, host, port, username, password, created_at, last_used_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    params![
                        connection.id,
                        connection.name,
                        connection.host,
                        connection.port,
                        connection.username,
                        connection.password,
                        connection.created_at,
                        connection.last_used_at,
                    ],
                )
            })
            .await
            .map_err(|e| AppError::StateError(format!("Failed to save connection: {}", e)))?;

        Ok(())
    }

    pub async fn list_connections(&self) -> AppResult<Vec<SavedConnection>> {
        self.conn
            .call(|conn| {
                let mut stmt = conn.prepare(
                    "SELECT id, name, host, port, username, password, created_at, last_used_at 
                     FROM connections 
                     ORDER BY last_used_at DESC",
                )?;
                let connections = stmt
                    .query_map([], |row| {
                        Ok(SavedConnection {
                            id: row.get(0)?,
                            name: row.get(1)?,
                            host: row.get(2)?,
                            port: row.get(3)?,
                            username: row.get(4)?,
                            password: row.get(5)?,
                            created_at: row.get(6)?,
                            last_used_at: row.get(7)?,
                        })
                    })?
                    .collect::<Result<Vec<_>, _>>()?;
                Ok(connections)
            })
            .await
            .map_err(|e| AppError::StateError(format!("Failed to list connections: {}", e)))
    }

    pub async fn update_last_used(&self, id: String) -> AppResult<()> {
        self.conn
            .call(move |conn| {
                conn.execute(
                    "UPDATE connections SET last_used_at = ? WHERE id = ?",
                    params![chrono::Utc::now().timestamp(), id],
                )
            })
            .await
            .map_err(|e| AppError::StateError(format!("Failed to update last used: {}", e)))?;
        Ok(())
    }

    pub async fn delete_connection(&self, id: String) -> AppResult<()> {
        self.conn
            .call(move |conn| {
                conn.execute("DELETE FROM connections WHERE id = ?", params![id])
            })
            .await
            .map_err(|e| AppError::StateError(format!("Failed to delete connection: {}", e)))?;
        Ok(())
    }
} 