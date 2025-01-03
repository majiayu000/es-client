use serde::Serialize;
use std::fmt;

#[derive(Debug, Serialize)]
pub enum AppError {
    ValidationError(String),
    ConnectionError(String),
    ElasticsearchError(String),
    StateError(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::ValidationError(msg) => write!(f, "验证错误: {}", msg),
            AppError::ConnectionError(msg) => write!(f, "连接错误: {}", msg),
            AppError::ElasticsearchError(msg) => write!(f, "Elasticsearch错误: {}", msg),
            AppError::StateError(msg) => write!(f, "状态错误: {}", msg),
        }
    }
}

impl std::error::Error for AppError {}

pub type AppResult<T> = Result<T, AppError>; 