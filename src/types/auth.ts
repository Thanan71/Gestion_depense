export interface AuthUser {
  id: string
  email: string
  displayName: string
}

export interface AuthResponse {
  ok: boolean
  user?: AuthUser
  message?: string
}
