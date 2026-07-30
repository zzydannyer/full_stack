use chrono::{NaiveDateTime, SecondsFormat};
use sqlx::{
    Executor, Row, SqlStr, Statement,
    mysql::MySqlRow,
    postgres::PgRow,
};

use crate::database::DatabaseState;

use super::{
    dto::Database,
    vo::BenchmarkRecord,
};

pub(super) async fn read(
    state: &DatabaseState,
    database: Database,
    limit: u32,
) -> Result<Vec<BenchmarkRecord>, sqlx::Error> {
    match database {
        Database::PostgreSQL => sqlx::query(
            r#"
            SELECT id, run_id, payload, score, created_at
            FROM benchmark_record
            WHERE run_id = 'seed'
            ORDER BY id
            LIMIT $1
            "#,
        )
        .bind(i64::from(limit))
        .fetch_all(&state.postgresql)
        .await?
        .into_iter()
        .map(postgresql_record)
        .collect(),
        Database::MySQL => sqlx::query(
            r#"
            SELECT id, run_id, payload, score, created_at
            FROM benchmark_record
            WHERE run_id = 'seed'
            ORDER BY id
            LIMIT ?
            "#,
        )
        .bind(i64::from(limit))
        .fetch_all(&state.mysql)
        .await?
        .into_iter()
        .map(mysql_record)
        .collect(),
    }
}

pub(super) async fn write(
    state: &DatabaseState,
    database: Database,
    run_id: &str,
    count: u32,
) -> Result<(), sqlx::Error> {
    match database {
        Database::PostgreSQL => {
            let mut transaction = state.postgresql.begin().await?;
            let statement = transaction
                .as_mut()
                .prepare(SqlStr::from_static(
                    r#"
                    INSERT INTO benchmark_record (run_id, payload, score, created_at)
                    VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
                    "#,
                ))
                .await?;
            for index in 0..count {
                statement
                    .query()
                    .bind(run_id)
                    .bind(format!("benchmark-{index}"))
                    .bind((index % 1000) as i32)
                    .execute(transaction.as_mut())
                    .await?;
            }
            transaction.commit().await?;
        }
        Database::MySQL => {
            let mut transaction = state.mysql.begin().await?;
            let statement = transaction
                .as_mut()
                .prepare(SqlStr::from_static(
                    r#"
                    INSERT INTO benchmark_record (run_id, payload, score, created_at)
                    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                    "#,
                ))
                .await?;
            for index in 0..count {
                statement
                    .query()
                    .bind(run_id)
                    .bind(format!("benchmark-{index}"))
                    .bind((index % 1000) as i32)
                    .execute(transaction.as_mut())
                    .await?;
            }
            transaction.commit().await?;
        }
    }
    Ok(())
}

pub(super) async fn cleanup(
    state: &DatabaseState,
    database: Database,
    run_id: &str,
) -> Result<u64, sqlx::Error> {
    match database {
        Database::PostgreSQL => Ok(sqlx::query(
            r#"
            DELETE FROM benchmark_record
            WHERE run_id = $1
            "#,
        )
        .bind(run_id)
        .execute(&state.postgresql)
        .await?
        .rows_affected()),
        Database::MySQL => Ok(sqlx::query(
            r#"
            DELETE FROM benchmark_record
            WHERE run_id = ?
            "#,
        )
        .bind(run_id)
        .execute(&state.mysql)
        .await?
        .rows_affected()),
    }
}

fn postgresql_record(row: PgRow) -> Result<BenchmarkRecord, sqlx::Error> {
    let created_at = row.try_get::<NaiveDateTime, _>("created_at")?;
    Ok(BenchmarkRecord {
        id: row.try_get("id")?,
        run_id: row.try_get("run_id")?,
        payload: row.try_get("payload")?,
        score: row.try_get("score")?,
        created_at: created_at
            .and_utc()
            .to_rfc3339_opts(SecondsFormat::Millis, true),
    })
}

fn mysql_record(row: MySqlRow) -> Result<BenchmarkRecord, sqlx::Error> {
    let created_at = row.try_get::<NaiveDateTime, _>("created_at")?;
    Ok(BenchmarkRecord {
        id: row.try_get("id")?,
        run_id: row.try_get("run_id")?,
        payload: row.try_get("payload")?,
        score: row.try_get("score")?,
        created_at: created_at
            .and_utc()
            .to_rfc3339_opts(SecondsFormat::Millis, true),
    })
}
