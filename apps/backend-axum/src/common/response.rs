use serde::Serialize;

#[derive(Serialize)]
pub(crate) struct ApiResponse<T> {
    pub(crate) code: u32,
    pub(crate) message: String,
    pub(crate) data: T,
}

pub(crate) fn success<T>(data: T) -> ApiResponse<T> {
    ApiResponse {
        code: 0,
        message: "ok".to_owned(),
        data,
    }
}
