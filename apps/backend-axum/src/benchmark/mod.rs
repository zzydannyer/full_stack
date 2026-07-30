use axum::{
    Router,
    routing::{delete, get, post},
};

use crate::database::DatabaseState;

mod dto;
mod handler;
mod repository;
mod service;
mod vo;

pub(crate) fn router() -> Router<DatabaseState> {
    Router::new()
        .route("/api/benchmark/ping", get(handler::ping))
        .route("/api/benchmark/json", get(handler::generate_json))
        .route("/api/benchmark/compute", get(handler::compute))
        .route(
            "/api/benchmark/database/read",
            get(handler::database_read),
        )
        .route(
            "/api/benchmark/database/write",
            post(handler::database_write),
        )
        .route(
            "/api/benchmark/database/write/{run_id}",
            delete(handler::database_cleanup),
        )
}
