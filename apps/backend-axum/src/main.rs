use std::error::Error;

use axum::{
    Router,
    http::{Method, header::CONTENT_TYPE},
};
use tower_http::cors::CorsLayer;

mod benchmark;
mod common;
mod config;
mod database;

use config::Config;
use database::DatabaseState;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let config = Config::from_env()?;
    let state = DatabaseState::connect(&config).await?;
    let cors = CorsLayer::new()
        .allow_origin(config.frontend_origin)
        .allow_methods([Method::GET, Method::POST, Method::DELETE])
        .allow_headers([CONTENT_TYPE]);
    let app = Router::new()
        .merge(benchmark::router())
        .layer(cors)
        .with_state(state);
    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", config.port)).await?;

    axum::serve(listener, app).await?;
    Ok(())
}
