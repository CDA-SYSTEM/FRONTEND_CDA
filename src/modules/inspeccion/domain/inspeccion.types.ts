/**
 * Ítem del checklist de inspección técnica NTC 5375.
 */
export interface ChecklistItem {
  id: string
  descripcion: string
  aprobado: boolean
}

/**
 * Resultado de una inspección técnica.
 */
export interface InspeccionResult {
  placa: string
  items: ChecklistItem[]
  aprobado: boolean
  fecha: string
}
