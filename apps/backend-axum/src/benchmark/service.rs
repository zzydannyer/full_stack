use crate::common::error::AppError;

use super::vo::{ComputeData, JsonData, JsonItem};

pub(super) fn generate_json(size: u32) -> Result<JsonData, AppError> {
    validate_range(size, 50_000, "size")?;
    let items = (0..size)
        .map(|index| JsonItem {
            index,
            name: format!("record-{index}"),
            active: index % 2 == 0,
            score: (index * 17) % 1000,
        })
        .collect();

    Ok(JsonData { count: size, items })
}

pub(super) fn compute(iterations: u32) -> Result<ComputeData, AppError> {
    validate_range(iterations, 50_000_000, "iterations")?;
    let mut checksum = 0_u32;
    for _ in 0..iterations {
        checksum = checksum
            .wrapping_mul(1_664_525)
            .wrapping_add(1_013_904_223);
    }

    Ok(ComputeData {
        iterations,
        checksum,
    })
}

pub(super) fn validate_limit(limit: u32) -> Result<(), AppError> {
    validate_range(limit, 10_000, "limit")
}

pub(super) fn validate_count(count: u32) -> Result<(), AppError> {
    validate_range(count, 1_000, "count")
}

pub(super) fn validate_run_id(run_id: &str) -> Result<(), AppError> {
    let length = run_id.chars().count();
    if length == 0 || length > 100 {
        return Err(AppError::validation(
            "runId must contain between 1 and 100 characters",
        ));
    }
    Ok(())
}

fn validate_range(value: u32, maximum: u32, name: &str) -> Result<(), AppError> {
    if value == 0 || value > maximum {
        return Err(AppError::validation(format!(
            "{name} must be between 1 and {maximum}"
        )));
    }
    Ok(())
}
