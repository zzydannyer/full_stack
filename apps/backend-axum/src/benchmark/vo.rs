use serde::Serialize;

use super::dto::Database;

#[derive(Serialize)]
pub(super) struct PingData {
    pub(super) status: &'static str,
}

#[derive(Serialize)]
pub(super) struct JsonData {
    pub(super) count: u32,
    pub(super) items: Vec<JsonItem>,
}

#[derive(Serialize)]
pub(super) struct JsonItem {
    pub(super) index: u32,
    pub(super) name: String,
    pub(super) active: bool,
    pub(super) score: u32,
}

#[derive(Serialize)]
pub(super) struct ComputeData {
    pub(super) iterations: u32,
    pub(super) checksum: u32,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct BenchmarkRecord {
    pub(super) id: i64,
    pub(super) run_id: String,
    pub(super) payload: String,
    pub(super) score: i32,
    pub(super) created_at: String,
}

#[derive(Serialize)]
pub(super) struct ReadData {
    pub(super) database: Database,
    pub(super) count: usize,
    pub(super) items: Vec<BenchmarkRecord>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct WriteData {
    pub(super) database: Database,
    pub(super) run_id: String,
    pub(super) count: u32,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct CleanupData {
    pub(super) database: Database,
    pub(super) run_id: String,
    pub(super) deleted: u64,
}
