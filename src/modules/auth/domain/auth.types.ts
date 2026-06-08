export type UserRole = 'ADMIN' | 'MANAGER' | 'OPERARIO' | 'INSPECTOR' | 'FACTURADOR' | 'SUPERADMIN' | 'ROLE_SUPERADMIN'

export interface AuthUser {
  id: string
  name: string
  role: UserRole
}

export interface LoginFormData {
  email: string
  password: string
}
