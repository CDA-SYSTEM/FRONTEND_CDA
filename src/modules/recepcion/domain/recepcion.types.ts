export type TipoVehiculo = 'moto' | 'liviano' | 'pesado'

// ── Catálogos del backend ─────────────────────────────────────────────────────

/** Viene de GET /api/v1/document-types */
export interface DocumentType {
  id: number
  nombre: string // ej. "Cédula de Ciudadanía", "Cédula de Extranjería"
  codigo?: string // ej. "CC", "CE"
}

/** Viene de GET /api/v1/person-types */
export interface PersonType {
  id: number
  nombre: string // ej. "Natural", "Jurídica"
}

// ── Entidad de dominio (como la devuelve el backend) ─────────────────────────

export interface ClientePersonaNatural {
  id: number | string
  nombre: string
  apellido: string
  identity: string
  celular: string
  email?: string
  direccion?: string
  birthDate?: string
  documentTypeId: number
  personTypeId: number
  active?: boolean
}

// ── DTO que envía el frontend al POST /api/v1/clients ────────────────────────

export interface CrearClienteDTO {
  nombre: string
  apellido: string
  identity: string // número de documento
  celular: string
  email?: string
  direccion?: string
  birthDate?: string // formato ISO: "YYYY-MM-DD"
  documentTypeId: number
  personTypeId: number
}

// ── Respuesta de error genérica ───────────────────────────────────────────────

export interface BackendErrorBody {
  message?: string
  statusCode?: number
}

// ── Vehículos ───────────────────────────────────────────────────────────────

export interface Vehiculo {
  id: number | string
  placa: string
  marca?: { id: number; nombre: string; name?: string } | string
  linea?: { id: number; nombre: string; name?: string } | string
  modelo?: number
  tipoVehiculo?: { id: number; nombre: string; name?: string } | string
  // Agrega más campos si el backend los devuelve
}
