package com.fullstack.springapi.benchmark;

import java.util.Map;

import com.fullstack.springapi.benchmark.dto.BenchmarkQuery;
import com.fullstack.springapi.benchmark.vo.BenchmarkVo;
import com.fullstack.springapi.common.ApiResponse;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/benchmark")
public class BenchmarkController {

    private final BenchmarkService benchmarkService;

    public BenchmarkController(BenchmarkService benchmarkService) {
        this.benchmarkService = benchmarkService;
    }

    @GetMapping("/ping")
    public ApiResponse<Map<String, String>> ping() {
        return ApiResponse.ok(benchmarkService.ping());
    }

    @GetMapping("/json")
    public ApiResponse<BenchmarkVo.JsonResult> json(@RequestParam int size) {
        return ApiResponse.ok(benchmarkService.json(new BenchmarkQuery.Json(size)));
    }

    @GetMapping("/compute")
    public ApiResponse<BenchmarkVo.ComputeResult> compute(@RequestParam int iterations) {
        return ApiResponse.ok(benchmarkService.compute(new BenchmarkQuery.Compute(iterations)));
    }

    @GetMapping("/database/read")
    public ApiResponse<BenchmarkVo.ReadResult> read(
            @RequestParam String database,
            @RequestParam int limit) {
        return ApiResponse.ok(benchmarkService.read(new BenchmarkQuery.Read(database, limit)));
    }

    @PostMapping("/database/write")
    public ApiResponse<BenchmarkVo.WriteResult> write(
            @RequestParam String database,
            @RequestParam int count,
            @RequestParam String runId) {
        return ApiResponse.ok(benchmarkService.write(new BenchmarkQuery.Write(database, count, runId)));
    }

    @DeleteMapping("/database/write/{runId}")
    public ApiResponse<BenchmarkVo.CleanupResult> cleanup(
            @PathVariable String runId,
            @RequestParam String database) {
        return ApiResponse.ok(benchmarkService.cleanup(new BenchmarkQuery.Cleanup(database, runId)));
    }
}
