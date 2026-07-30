package com.fullstack.springapi.benchmark;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import com.fullstack.springapi.benchmark.BenchmarkRepository.Database;
import com.fullstack.springapi.benchmark.dto.BenchmarkQuery;
import com.fullstack.springapi.benchmark.vo.BenchmarkVo;
import com.fullstack.springapi.benchmark.vo.BenchmarkVo.DatabaseItem;
import com.fullstack.springapi.benchmark.vo.BenchmarkVo.JsonItem;
import com.fullstack.springapi.common.ApiException;
import com.fullstack.springapi.common.ErrorCode;
import org.springframework.stereotype.Service;

@Service
public class BenchmarkService {

    private final BenchmarkRepository benchmarkRepository;

    public BenchmarkService(BenchmarkRepository benchmarkRepository) {
        this.benchmarkRepository = benchmarkRepository;
    }

    public Map<String, String> ping() {
        return Map.of("status", "ok");
    }

    public BenchmarkVo.JsonResult json(BenchmarkQuery.Json query) {
        requireRange(query.size(), 1, 50_000);
        List<JsonItem> items = new ArrayList<>(query.size());
        for (int index = 0; index < query.size(); index++) {
            items.add(new JsonItem(index, "record-" + index, index % 2 == 0, index * 17 % 1000));
        }
        return new BenchmarkVo.JsonResult(query.size(), items);
    }

    public BenchmarkVo.ComputeResult compute(BenchmarkQuery.Compute query) {
        requireRange(query.iterations(), 1, 50_000_000);
        long checksum = 0;
        for (int index = 0; index < query.iterations(); index++) {
            checksum = (checksum * 1_664_525L + 1_013_904_223L) & 0xffff_ffffL;
        }
        return new BenchmarkVo.ComputeResult(query.iterations(), checksum);
    }

    public BenchmarkVo.ReadResult read(BenchmarkQuery.Read query) {
        requireRange(query.limit(), 1, 10_000);
        Database database = database(query.database());
        List<DatabaseItem> items = benchmarkRepository.read(database, query.limit());
        return new BenchmarkVo.ReadResult(query.database(), items.size(), items);
    }

    public BenchmarkVo.WriteResult write(BenchmarkQuery.Write query) {
        requireRange(query.count(), 1, 1_000);
        requireRunId(query.runId());
        Database database = database(query.database());
        benchmarkRepository.write(database, query.count(), query.runId());
        return new BenchmarkVo.WriteResult(query.database(), query.runId(), query.count());
    }

    public BenchmarkVo.CleanupResult cleanup(BenchmarkQuery.Cleanup query) {
        requireRunId(query.runId());
        Database database = database(query.database());
        int deleted = benchmarkRepository.cleanup(database, query.runId());
        return new BenchmarkVo.CleanupResult(query.database(), query.runId(), deleted);
    }

    private Database database(String database) {
        return switch (database) {
            case "postgresql" -> Database.POSTGRESQL;
            case "mysql" -> Database.MYSQL;
            default -> throw new ApiException(
                    ErrorCode.INVALID_PARAMETER,
                    "database must be postgresql or mysql");
        };
    }

    private void requireRange(int value, int minimum, int maximum) {
        if (value < minimum || value > maximum) {
            throw new ApiException(
                    ErrorCode.INVALID_PARAMETER,
                    "parameter must be between " + minimum + " and " + maximum);
        }
    }

    private void requireRunId(String runId) {
        if (runId.isEmpty() || runId.length() > 100) {
            throw new ApiException(
                    ErrorCode.INVALID_PARAMETER,
                    "runId length must be between 1 and 100");
        }
    }
}
