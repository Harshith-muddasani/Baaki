// Mirrors the backend's DTOs (com.baaki.dto.*). Keep field names identical
// to the Java records so payloads can be passed straight through.

export type SplitType = 'EQUAL' | 'EXACT' | 'PERCENTAGE' | 'SHARES'

export interface UserResponse {
  id: number
  name: string
  email: string
  createdAt: string
}

export interface GroupResponse {
  id: number
  name: string
  createdByUserId: number
  createdAt: string
}

export interface GroupMemberResponse {
  groupId: number
  userId: number
  userName: string
  joinedAt: string
}

export interface SplitParticipantRequest {
  userId: number
  amount: number | null
  percentage: number | null
  shares: number | null
}

export interface CreateExpenseRequest {
  paidByUserId: number
  description: string
  totalAmount: number
  currency: string
  splitType: SplitType
  participants: SplitParticipantRequest[]
  createdByUserId: number
}

export interface ExpenseSplitResponse {
  userId: number
  userName: string
  shareAmount: number
}

export interface ExpenseResponse {
  id: number
  groupId: number
  paidByUserId: number
  description: string
  totalAmount: number
  currency: string
  splitType: SplitType
  createdByUserId: number
  createdAt: string
  deleted: boolean
  splits: ExpenseSplitResponse[]
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface BalanceResponse {
  userId: number
  userName: string
  netBalance: number
}

export interface SettlementSuggestionResponse {
  fromUserId: number
  toUserId: number
  amount: number
}

export interface CreateSettlementRequest {
  paidByUserId: number
  paidToUserId: number
  amount: number
}

export interface SettlementResponse {
  id: number
  groupId: number
  paidByUserId: number
  paidToUserId: number
  amount: number
  status: string
  createdAt: string
}

export interface ProblemDetail {
  title?: string
  status?: number
  detail?: string
  errors?: string[]
}
