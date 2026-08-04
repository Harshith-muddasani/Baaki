import axios, { AxiosError } from 'axios'
import type { ProblemDetail } from '@/lib/types'
import type {
  BalanceResponse,
  CreateExpenseRequest,
  CreateSettlementRequest,
  ExpenseResponse,
  GroupMemberResponse,
  GroupResponse,
  PageResponse,
  SettlementResponse,
  SettlementSuggestionResponse,
  UserResponse,
} from '@/lib/types'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080',
})

/** Our GlobalExceptionHandler returns RFC 7807 ProblemDetail bodies - surface `detail` (and any field errors) in the UI instead of a generic failure message. */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const problem = (error as AxiosError<ProblemDetail>).response?.data
    if (problem?.errors?.length) return problem.errors.join(', ')
    if (problem?.detail) return problem.detail
  }
  return 'Something went wrong. Please try again.'
}

export const usersApi = {
  create: (body: { name: string; email: string; password: string }) =>
    api.post<UserResponse>('/users', body).then((r) => r.data),
  list: () => api.get<UserResponse[]>('/users').then((r) => r.data),
  get: (id: number) => api.get<UserResponse>(`/users/${id}`).then((r) => r.data),
}

export const groupsApi = {
  create: (body: { name: string; createdByUserId: number }) =>
    api.post<GroupResponse>('/groups', body).then((r) => r.data),
  /** Omitting memberUserId lists every group system-wide - callers should
   *  always scope this to the current user unless that's genuinely intended. */
  list: (memberUserId?: number) =>
    api
      .get<GroupResponse[]>('/groups', { params: memberUserId ? { memberUserId } : undefined })
      .then((r) => r.data),
  get: (id: number) => api.get<GroupResponse>(`/groups/${id}`).then((r) => r.data),
}

export const groupMembersApi = {
  list: (groupId: number) =>
    api.get<GroupMemberResponse[]>(`/groups/${groupId}/members`).then((r) => r.data),
  add: (groupId: number, userId: number) =>
    api.post<GroupMemberResponse>(`/groups/${groupId}/members`, { userId }).then((r) => r.data),
}

export const expensesApi = {
  list: (groupId: number, page = 0, size = 20) =>
    api
      .get<PageResponse<ExpenseResponse>>(`/groups/${groupId}/expenses`, { params: { page, size } })
      .then((r) => r.data),
  create: (groupId: number, body: CreateExpenseRequest) =>
    api.post<ExpenseResponse>(`/groups/${groupId}/expenses`, body).then((r) => r.data),
  remove: (groupId: number, expenseId: number) =>
    api.delete(`/groups/${groupId}/expenses/${expenseId}`),
}

export const balancesApi = {
  list: (groupId: number) =>
    api.get<BalanceResponse[]>(`/groups/${groupId}/balances`).then((r) => r.data),
}

export const settlementSuggestionsApi = {
  list: (groupId: number) =>
    api
      .get<SettlementSuggestionResponse[]>(`/groups/${groupId}/settlements/suggestions`)
      .then((r) => r.data),
}

export const settlementsApi = {
  create: (groupId: number, body: CreateSettlementRequest, idempotencyKey: string) =>
    api
      .post<SettlementResponse>(`/groups/${groupId}/settlements`, body, {
        headers: { 'Idempotency-Key': idempotencyKey },
      })
      .then((r) => r.data),
}
