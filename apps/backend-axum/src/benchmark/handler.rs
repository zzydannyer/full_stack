use axum::{
    Json,
    extract::{
        Path, Query, State,
        rejection::{PathRejection, QueryRejection},
    },
};

use crate::{
    common::{
        error::AppError,
        response::{ApiResponse, success},
    },
    database::DatabaseState,
};

use super::{
    dto::{ComputeQuery, DatabaseQuery, JsonQuery, ReadQuery, WriteQuery},
    repository,
    service,
    vo::{CleanupData, ComputeData, JsonData, PingData, ReadData, WriteData},
};

pub(super) async fn ping() -> Json<ApiResponse<PingData>> {
    Json(success(PingData { status: "ok" }))
}

pub(super) async fn generate_json(
    query: Result<Query<JsonQuery>, QueryRejection>,
) -> Result<Json<ApiResponse<JsonData>>, AppError> {
    let Query(query) = query.map_err(query_error)?;
    Ok(Json(success(service::generate_json(query.size)?)))
}

pub(super) async fn compute(
    query: Result<Query<ComputeQuery>, QueryRejection>,
) -> Result<Json<ApiResponse<ComputeData>>, AppError> {
    let Query(query) = query.map_err(query_error)?;
    Ok(Json(success(service::compute(query.iterations)?)))
}

pub(super) async fn database_read(
    State(state): State<DatabaseState>,
    query: Result<Query<ReadQuery>, QueryRejection>,
) -> Result<Json<ApiResponse<ReadData>>, AppError> {
    let Query(query) = query.map_err(query_error)?;
    service::validate_limit(query.limit)?;
    let items = repository::read(&state, query.database, query.limit).await?;
    let count = items.len();

    Ok(Json(success(ReadData {
        database: query.database,
        count,
        items,
    })))
}

pub(super) async fn database_write(
    State(state): State<DatabaseState>,
    query: Result<Query<WriteQuery>, QueryRejection>,
) -> Result<Json<ApiResponse<WriteData>>, AppError> {
    let Query(query) = query.map_err(query_error)?;
    service::validate_count(query.count)?;
    service::validate_run_id(&query.run_id)?;
    repository::write(&state, query.database, &query.run_id, query.count).await?;

    Ok(Json(success(WriteData {
        database: query.database,
        run_id: query.run_id,
        count: query.count,
    })))
}

pub(super) async fn database_cleanup(
    State(state): State<DatabaseState>,
    path: Result<Path<String>, PathRejection>,
    query: Result<Query<DatabaseQuery>, QueryRejection>,
) -> Result<Json<ApiResponse<CleanupData>>, AppError> {
    let Path(run_id) = path.map_err(|error| AppError::validation(error.body_text()))?;
    let Query(query) = query.map_err(query_error)?;
    service::validate_run_id(&run_id)?;
    let deleted = repository::cleanup(&state, query.database, &run_id).await?;

    Ok(Json(success(CleanupData {
        database: query.database,
        run_id,
        deleted,
    })))
}

fn query_error(error: QueryRejection) -> AppError {
    AppError::validation(error.body_text())
}
