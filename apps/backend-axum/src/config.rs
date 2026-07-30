use std::{env, error::Error};

use axum::http::HeaderValue;

pub(crate) struct Config {
    pub(crate) postgresql_url: String,
    pub(crate) mysql_url: String,
    pub(crate) frontend_origin: HeaderValue,
    pub(crate) port: String,
}

impl Config {
    pub(crate) fn from_env() -> Result<Self, Box<dyn Error>> {
        Ok(Self {
            postgresql_url: env::var("POSTGRESQL_URL")?,
            mysql_url: env::var("MYSQL_URL")?,
            frontend_origin: HeaderValue::from_str(&env::var("FRONTEND_ORIGIN")?)?,
            port: env::var("PORT")?,
        })
    }
}
