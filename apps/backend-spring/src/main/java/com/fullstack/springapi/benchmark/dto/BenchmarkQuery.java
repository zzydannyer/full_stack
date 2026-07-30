package com.fullstack.springapi.benchmark.dto;

public final class BenchmarkQuery {

    private BenchmarkQuery() {
    }

    public record Json(int size) {
    }

    public record Compute(int iterations) {
    }

    public record Read(String database, int limit) {
    }

    public record Write(String database, int count, String runId) {
    }

    public record Cleanup(String database, String runId) {
    }
}
