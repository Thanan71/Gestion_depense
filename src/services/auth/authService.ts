import type { AuthResponse } from '@/types/auth'

const request = async (path: string, payload?: unknown): Promise<AuthResponse> => {
  const response = await fetch(`/.netlify/functions/${path}`, {
    method: payload ? 'POST' : 'GET',
    headers: payload
      ? { 'content-type': 'application/json', accept: 'application/json' }
      : { accept: 'application/json' },
    credentials: 'include',
    body: payload ? JSON.stringify(payload) : undefined
  })

  return (await response.json()) as AuthResponse
}

export const authService = {
  me: () => request('auth-me'),
  login: (email: string, password: string) => request('auth-login', { email, password }),
  register: (email: string, password: string, displayName: string) =>
    request('auth-register', { email, password, displayName }),
  logout: () => request('auth-logout', {})
}
