use sqlx::{
    MySqlPool, PgPool,
    mysql::MySqlPoolOptions,
    postgres::PgPoolOptions,
};

use crate::config::Config;

#[derive(Clone)]
pub(crate) struct DatabaseState {
    pub(crate) postgresql: PgPool,
    pub(crate) mysql: MySqlPool,
}

impl DatabaseState {
    pub(crate) async fn connect(config: &Config) -> Result<Self, sqlx::Error> {
        Ok(Self {
            postgresql: PgPoolOptions::new()
                .connect(&config.postgresql_url)
                .await?,
            mysql: MySqlPoolOptions::new().connect(&config.mysql_url).await?,
        })
    }
}
