import { envDTO } from "./env.dto.js"

export const env = envDTO.parse(process.env)
