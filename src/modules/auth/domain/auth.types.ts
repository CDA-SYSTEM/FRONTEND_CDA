export type UserRole = 'ADMIN' | 'RECEPCIONISTA' | 'INSPECTOR' | 'FACTURADOR'

export interface AuthUser {
  id: string
  name: string
  role: UserRole
}

export interface LoginFormData {
  email: string
  password: string
}
