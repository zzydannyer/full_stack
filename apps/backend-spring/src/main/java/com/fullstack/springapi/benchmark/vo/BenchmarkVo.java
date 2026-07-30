package com.fullstack.springapi.benchmark.vo;

import java.util.List;

public final class BenchmarkVo {

    private BenchmarkVo() {
    }

    public record JsonItem(int index, String name, boolean active, int score) {
    }

    public record JsonResult(int count, List<JsonItem> items) {
    }

    public record ComputeResult(int iterations, long checksum) {
    }

    public record DatabaseItem(long id, String runId, String payload, int score, String createdAt) {
    }

    public record ReadResult(String database, int count, List<DatabaseItem> items) {
    }

    public record WriteResult(String database, String runId, int count) {
    }

    public record CleanupResult(String database, String runId, int deleted) {
    }
}
