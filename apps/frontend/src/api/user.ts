import type {
  CreateUserBody,
  PageQuery,
  PageResult,
  UpdateUserBody,
  User,
} from "@full-stack/shared"
import { http } from "./http"

export function fetchUsers(query: PageQuery) {
  return http.get<PageResult<User>>("/users", { params: query })
}

export function createUserApi(payload: CreateUserBody) {
  return http.post<User>("/users", payload)
}

export function updateUserApi(id: string, payload: UpdateUserBody) {
  return http.patch<User>(`/users/${id}`, payload)
}

export function deleteUserApi(id: string) {
  return http.delete(`/users/${id}`)
}
