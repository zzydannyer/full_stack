import { Injectable } from "@nestjs/common"
import { Counter, Registry, collectDefaultMetrics } from "prom-client"

@Injectable()
export class MetricsService {
  private readonly registry = new Registry()
  private readonly httpRequests: Counter

  constructor() {
    collectDefaultMetrics({ register: this.registry })
    this.httpRequests = new Counter({
      name: "http_requests_total",
      help: "Total HTTP requests",
      labelNames: ["method", "path", "status"],
      registers: [this.registry],
    })
  }

  incrementRequest(method: string, path: string, status: number) {
    this.httpRequests.inc({ method, path, status: `${status}` })
  }

  async render() {
    return this.registry.metrics()
  }
}
