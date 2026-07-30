import { app } from "./app"
import { port } from "./config/env"

app
  .listen({
    hostname: "0.0.0.0",
    port,
  })
