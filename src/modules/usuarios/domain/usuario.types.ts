export type RolUsuario = 'ADMIN' | 'RECEPCIONISTA' | 'INSPECTOR' | 'FACTURADOR' | 'MANAGER' | 'OPERARIO'
export type RolUsuarioForm = 'admin' | 'manager' | 'inspector' | 'operario'
export type TipoIdentificacion = 'cc' | 'ce' | 'nit'

export interface Usuario {
  id: string
  name?: string
  firstName?: string
  lastName?: string
  email: string
  role: RolUsuario
  isActive: boolean
}

export interface CrearUsuarioDTO {
  identificationType: TipoIdentificacion
  identificationNumber: string
  firstName: string
  lastName: string
  phoneNumber: string
  email: string
  password?: string
  role: RolUsuarioForm
}

export interface ActualizarUsuarioDTO {
  firstName?: string
  lastName?: string
  phoneNumber?: string
  role?: RolUsuarioForm
  isActive?: boolean
}
