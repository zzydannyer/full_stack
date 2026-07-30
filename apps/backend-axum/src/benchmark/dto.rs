use serde::{Deserialize, Serialize};

#[derive(Clone, Copy, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub(super) enum Database {
    PostgreSQL,
    MySQL,
}

#[derive(Deserialize)]
pub(super) struct JsonQuery {
    pub(super) size: u32,
}

#[derive(Deserialize)]
pub(super) struct ComputeQuery {
    pub(super) iterations: u32,
}

#[derive(Deserialize)]
pub(super) struct ReadQuery {
    pub(super) database: Database,
    pub(super) limit: u32,
}

#[derive(Deserialize)]
pub(super) struct WriteQuery {
    pub(super) database: Database,
    pub(super) count: u32,
    #[serde(rename = "runId")]
    pub(super) run_id: String,
}

#[derive(Deserialize)]
pub(super) struct DatabaseQuery {
    pub(super) database: Database,
}
