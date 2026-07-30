use axum::{
    Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde_json::json;

use super::response::ApiResponse;

const VALIDATION_CODE: u32 = 10001;
const INTERNAL_CODE: u32 = 10007;

#[derive(Debug)]
pub(crate) struct AppError {
    status: StatusCode,
    code: u32,
    message: String,
}

impl AppError {
    pub(crate) fn validation(message: impl Into<String>) -> Self {
        Self {
            status: StatusCode::BAD_REQUEST,
            code: VALIDATION_CODE,
            message: message.into(),
        }
    }

    fn internal() -> Self {
        Self {
            status: StatusCode::INTERNAL_SERVER_ERROR,
            code: INTERNAL_CODE,
            message: "internal error".to_owned(),
        }
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        (
            self.status,
            Json(ApiResponse {
                code: self.code,
                message: self.message,
                data: json!({}),
            }),
        )
            .into_response()
    }
}

impl From<sqlx::Error> for AppError {
    fn from(_error: sqlx::Error) -> Self {
        Self::internal()
    }
}
