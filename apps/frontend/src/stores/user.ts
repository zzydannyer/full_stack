import { defineStore } from "pinia"
import { ref } from "vue"
import type { CreateUserBody, PageQuery, UpdateUserBody, User } from "@full-stack/shared"
import { createUserApi, deleteUserApi, fetchUsers, updateUserApi } from "@/api/user"

export const useUserStore = defineStore("user", () => {
  const users = ref<User[]>([])
  const total = ref(0)
  const page = ref(1)
  const pageSize = ref(20)
  const loading = ref(false)

  async function loadUsers(query: PageQuery = { page: page.value, pageSize: pageSize.value }) {
    loading.value = true
    await fetchUsers(query)
      .then(
        (res) => {
          users.value = res.data.items
          total.value = res.data.total
          page.value = res.data.page
          pageSize.value = res.data.pageSize
        },
        () => undefined,
      )
      .finally(() => {
        loading.value = false
      })
  }

  async function createUser(payload: CreateUserBody) {
    loading.value = true
    const ok = await createUserApi(payload).then(
      () => true,
      () => false,
    )
    if (!ok) {
      loading.value = false
      return false
    }
    await loadUsers({ page: page.value, pageSize: pageSize.value })
    return true
  }

  async function updateUser(id: string, payload: UpdateUserBody) {
    loading.value = true
    const ok = await updateUserApi(id, payload).then(
      () => true,
      () => false,
    )
    if (!ok) {
      loading.value = false
      return false
    }
    await loadUsers({ page: page.value, pageSize: pageSize.value })
    return true
  }

  async function removeUser(id: string) {
    loading.value = true
    const ok = await deleteUserApi(id).then(
      () => true,
      () => false,
    )
    if (!ok) {
      loading.value = false
      return false
    }
    await loadUsers({ page: page.value, pageSize: pageSize.value })
    return true
  }

  return {
    users,
    total,
    page,
    pageSize,
    loading,
    loadUsers,
    createUser,
    updateUser,
    removeUser,
  }
})
