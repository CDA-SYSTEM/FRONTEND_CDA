import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  clienteSchema,
  inferirCodigo,
  validarIdentityPorTipo,
  type ClienteSchema,
} from '@/modules/recepcion/domain/recepcion.schema'
import { clienteService } from '@/modules/recepcion/services/clienteService'
import type {
  ClientePersonaNatural,
  DocumentType,
  PersonType,
} from '@/modules/recepcion/domain/recepcion.types'

export type EstadoFormulario =
  | 'idle'
  | 'cargando'
  | 'enviando'
  | 'exito'
  | 'error'

/**
 * Hook de aplicación — HU-005: Registrar cliente persona natural.
 *
 * Responsabilidades:
 *  1. Cargar catálogos del backend (document-types, person-types)
 *  2. Orquestar validación Zod + validación cruzada de identity
 *  3. Enviar POST /api/v1/clients con el DTO correcto
 *  4. Detectar duplicados (409) e informar al campo correspondiente
 */
export function useRegistrarCliente() {
  // ── Estado de catálogos ────────────────────────────────────────────────────
  const [tiposDocumento, setTiposDocumento] = useState<DocumentType[]>([])
  const [tiposPersona, setTiposPersona] = useState<PersonType[]>([])
  const [errorCatalogo, setErrorCatalogo] = useState<string | null>(null)

  // ── Estado del formulario ──────────────────────────────────────────────────
  const [estado, setEstado] = useState<EstadoFormulario>('cargando')
  const [clienteGuardado, setClienteGuardado] =
    useState<ClientePersonaNatural | null>(null)
  const [errorServidor, setErrorServidor] = useState<string | null>(null)

  const form = useForm<ClienteSchema>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nombre: '',
      apellido: '',
      identity: '',
      documentTypeId: 0,
      personTypeId: 0,
      celular: '',
      email: '',
      direccion: '',
      birthDate: '',
    },
  })

  // ── Cargar catálogos al montar ─────────────────────────────────────────────
  useEffect(() => {
    let mounted = true

    async function cargarCatalogos() {
      try {
        const [docs, personas] = await Promise.all([
          clienteService.obtenerTiposDocumento(),
          clienteService.obtenerTiposPersona(),
        ])

        if (!mounted) return

        setTiposDocumento(docs)
        setTiposPersona(personas)

        // Pre-seleccionar el primer tipo de documento disponible
        if (docs.length > 0) {
          form.setValue('documentTypeId', docs[0].id)
        }

        // Pre-seleccionar automáticamente "Natural" si existe
        const natural = personas.find((p) =>
          p.nombre.toLowerCase().includes('natural'),
        )
        if (natural) {
          form.setValue('personTypeId', natural.id)
        } else if (personas.length > 0) {
          form.setValue('personTypeId', personas[0].id)
        }

        setEstado('idle')
      } catch {
        if (!mounted) return
        setErrorCatalogo(
          'No se pudieron cargar los tipos de documento. Verifique la conexión.',
        )
        setEstado('error')
      }
    }

    cargarCatalogos()
    return () => {
      mounted = false
    }
  }, [])

  // ── Reset completo ─────────────────────────────────────────────────────────
  const resetFormulario = () => {
    form.reset()
    setEstado('idle')
    setClienteGuardado(null)
    setErrorServidor(null)

    // Restaurar pre-selecciones
    if (tiposDocumento.length > 0) {
      form.setValue('documentTypeId', tiposDocumento[0].id)
    }
    const natural = tiposPersona.find((p) =>
      p.nombre.toLowerCase().includes('natural'),
    )
    if (natural) form.setValue('personTypeId', natural.id)
    else if (tiposPersona.length > 0)
      form.setValue('personTypeId', tiposPersona[0].id)
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  const onSubmit = form.handleSubmit(async (data: ClienteSchema) => {
    // Validación cruzada: formato de identity según el tipo de documento elegido
    const tipoSeleccionado = tiposDocumento.find(
      (d) => d.id === data.documentTypeId,
    )
    const codigoTipo = tipoSeleccionado
      ? inferirCodigo(tipoSeleccionado.nombre)
      : 'OTRO'

    const errorIdentity = validarIdentityPorTipo(codigoTipo, data.identity)
    if (errorIdentity) {
      form.setError('identity', { message: errorIdentity })
      return
    }

    setEstado('enviando')
    setErrorServidor(null)

    try {
      const cliente = await clienteService.crearCliente({
        nombre: data.nombre.trim(),
        apellido: data.apellido.trim(),
        identity: data.identity.trim().toUpperCase(),
        celular: data.celular.trim(),
        email: data.email?.trim() || undefined,
        direccion: data.direccion?.trim() || undefined,
        birthDate: data.birthDate?.trim() || undefined,
        documentTypeId: data.documentTypeId,
        personTypeId: data.personTypeId,
      })

      setClienteGuardado(cliente)
      setEstado('exito')
      form.reset()
    } catch (error: unknown) {
      const e = error as {
        response?: { status?: number; data?: { message?: string } }
      }

      if (e.response?.status === 409) {
        form.setError('identity', {
          message:
            'Ya existe un cliente registrado con este número de documento',
        })
        setEstado('error')
        return
      }

      const msg =
        e.response?.data?.message ??
        'Error al registrar el cliente. Intente de nuevo.'
      setErrorServidor(msg)
      setEstado('error')
    }
  })

  return {
    form,
    estado,
    clienteGuardado,
    errorServidor,
    errorCatalogo,
    tiposDocumento,
    tiposPersona,
    onSubmit,
    resetFormulario,
  }
}
