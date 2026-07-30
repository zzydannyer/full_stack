package com.fullstack.springapi.benchmark;

import java.util.List;

import javax.sql.DataSource;

import com.fullstack.springapi.benchmark.vo.BenchmarkVo.DatabaseItem;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.support.TransactionTemplate;

@Repository
public class BenchmarkRepository {

    private final DatabaseContext postgresql;
    private final DatabaseContext mysql;

    public BenchmarkRepository(
            @Qualifier("postgresqlDataSource") DataSource postgresqlDataSource,
            @Qualifier("mysqlDataSource") DataSource mysqlDataSource) {
        postgresql = context(postgresqlDataSource);
        mysql = context(mysqlDataSource);
    }

    public List<DatabaseItem> read(Database database, int limit) {
        return context(database).jdbcTemplate().query(
                """
                SELECT id, run_id, payload, score, created_at
                FROM benchmark_record
                WHERE run_id = 'seed'
                ORDER BY id
                LIMIT ?
                """,
                (resultSet, rowNumber) -> new DatabaseItem(
                        resultSet.getLong("id"),
                        resultSet.getString("run_id"),
                        resultSet.getString("payload"),
                        resultSet.getInt("score"),
                        resultSet.getTimestamp("created_at").toInstant().toString()),
                limit);
    }

    public void write(Database database, int count, String runId) {
        DatabaseContext context = context(database);
        context.transactionTemplate().executeWithoutResult(transaction -> {
            for (int index = 0; index < count; index++) {
                context.jdbcTemplate().update(
                        "INSERT INTO benchmark_record (run_id, payload, score) VALUES (?, ?, ?)",
                        runId,
                        "benchmark-" + index,
                        index % 1000);
            }
        });
    }

    public int cleanup(Database database, String runId) {
        return context(database).jdbcTemplate().update(
                "DELETE FROM benchmark_record WHERE run_id = ?",
                runId);
    }

    private DatabaseContext context(Database database) {
        return switch (database) {
            case POSTGRESQL -> postgresql;
            case MYSQL -> mysql;
        };
    }

    private DatabaseContext context(DataSource dataSource) {
        return new DatabaseContext(
                new JdbcTemplate(dataSource),
                new TransactionTemplate(new DataSourceTransactionManager(dataSource)));
    }

    public enum Database {
        POSTGRESQL,
        MYSQL
    }

    private record DatabaseContext(
            JdbcTemplate jdbcTemplate,
            TransactionTemplate transactionTemplate) {
    }
}
