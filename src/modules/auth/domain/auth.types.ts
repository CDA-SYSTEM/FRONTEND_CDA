export type UserRole = 'admin' | 'manager' | 'operario' | 'inspector' | 'facturador' | 'superadmin'

export interface AuthUser {
  id: string
  name: string
  role: UserRole
}

export interface LoginFormData {
  email: string
  password: string
}
