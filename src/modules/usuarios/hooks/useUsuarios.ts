import { useCallback, useEffect, useState } from 'react'
import { usuarioService } from '@/modules/usuarios/services/usuarioService'
import { authService } from '@/modules/auth/services/authService'
import type {
  CrearUsuarioDTO,
  RolUsuario,
  RolUsuarioForm,
  Usuario,
} from '@/modules/usuarios/domain/usuario.types'

const INITIAL_FORM: CrearUsuarioDTO = {
  identificationType: 'cc',
  identificationNumber: '',
  firstName: '',
  lastName: '',
  phoneNumber: '',
  email: '',
  role: 'inspector',
}

/**
 * Hook de aplicación (caso de uso) para la gestión de usuarios.
 * Encapsula todo el estado y los handlers que antes vivían en UsuariosPage.
 */
export function useUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(false)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [filtroRol, setFiltroRol] = useState<'' | RolUsuarioForm>('')
  const [busqueda, setBusqueda] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [errorMensaje, setErrorMensaje] = useState('')
  const [formData, setFormData] = useState<CrearUsuarioDTO>(INITIAL_FORM)

  // Catálogos dinámicos
  const [rolesList, setRolesList] = useState<string[]>([])
  const [identificacionesList, setIdentificacionesList] = useState<{ code: string; name: string }[]>([])

  // Restablecimiento de contraseña
  const [resetUserId, setResetUserId] = useState<string | null>(null)
  const [resetPasswordVal, setResetPasswordVal] = useState('')

  const clearFeedback = () => {
    setMensaje('')
    setErrorMensaje('')
  }

  const cargarUsuarios = useCallback(
    async (rol?: '' | RolUsuarioForm) => {
      try {
        setLoading(true)
        setErrorMensaje('')
        const data = await usuarioService.obtenerUsuarios(
          (rol ?? filtroRol) || undefined,
        )
        setUsuarios(data)
      } catch {
        setErrorMensaje('No se pudo cargar la lista de usuarios.')
      } finally {
        setLoading(false)
      }
    },
    [filtroRol],
  )

  useEffect(() => {
    cargarUsuarios(filtroRol)
  }, [filtroRol, cargarUsuarios])

  // Cargar catálogos dinámicos
  useEffect(() => {
    async function loadCatalogs() {
      try {
        const [roles, idTypes] = await Promise.all([
          authService.obtenerRoles(),
          usuarioService.obtenerTiposIdentificacion(),
        ])
        setRolesList(roles)
        setIdentificacionesList(idTypes)
      } catch (err) {
        console.error('Error cargando catálogos de usuarios:', err)
      }
    }
    loadCatalogs()
  }, [])

  const handleCambiarRol = async (id: string, nuevoRol: string) => {
    if (!window.confirm(`¿Confirmas cambiar el rol a ${nuevoRol}?`)) return
    try {
      clearFeedback()
      await usuarioService.cambiarRol(id, { role: nuevoRol as RolUsuario })
      setMensaje('Rol actualizado correctamente.')
      cargarUsuarios()
    } catch {
      setErrorMensaje('No se pudo actualizar el rol.')
    }
  }

  const handleToggleEstado = async (usuario: Usuario) => {
    const accion = usuario.isActive ? 'desactivar' : 'activar'
    if (!window.confirm(`¿Confirmas ${accion} este usuario?`)) return
    try {
      clearFeedback()
      await usuarioService.cambiarEstado(usuario.id, !usuario.isActive)
      setMensaje(
        `Usuario ${usuario.isActive ? 'desactivado' : 'activado'} correctamente.`,
      )
      cargarUsuarios()
    } catch {
      setErrorMensaje('No se pudo cambiar el estado del usuario.')
    }
  }

  const handleFormChange = (e: { target: { name: string; value: string } }) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'role' ? (value as RolUsuarioForm) : value,
    }))
  }

  const handleCrearUsuario = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    try {
      clearFeedback()
      await usuarioService.crearUsuario(formData)
      setMostrarModal(false)
      setFormData(INITIAL_FORM)
      setMensaje('Usuario creado correctamente.')
      cargarUsuarios()
    } catch {
      setErrorMensaje('Hubo un error al registrar el usuario.')
    }
  }

  const handleResetPassword = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    if (!resetUserId || !resetPasswordVal.trim()) return
    try {
      clearFeedback()
      await usuarioService.restablecerPassword(resetUserId, resetPasswordVal.trim())
      setMensaje('Contraseña restablecida correctamente.')
      setResetUserId(null)
      setResetPasswordVal('')
    } catch {
      setErrorMensaje('No se pudo restablecer la contraseña del usuario.')
    }
  }

  const handleBuscar = async () => {
    const term = busqueda.trim()
    if (!term) {
      cargarUsuarios()
      return
    }
    try {
      setLoading(true)
      clearFeedback()
      const results = await usuarioService.buscarUsuarios(term)
      setUsuarios(results)
      if (results.length === 0) {
        setMensaje('No se encontraron usuarios para la búsqueda.')
      }
    } catch {
      setErrorMensaje('No se pudo realizar la búsqueda.')
    } finally {
      setLoading(false)
    }
  }

  const handleLimpiarBusqueda = () => {
    setBusqueda('')
    clearFeedback()
    cargarUsuarios()
  }

  const handleEliminarUsuario = async (id: string) => {
    if (
      !window.confirm(
        '¿Seguro que deseas eliminar este usuario? Esta acción no se puede deshacer.',
      )
    )
      return
    try {
      clearFeedback()
      await usuarioService.eliminarUsuario(id)
      setMensaje('Usuario eliminado correctamente.')
      cargarUsuarios()
    } catch {
      setErrorMensaje('No se pudo eliminar el usuario.')
    }
  }

  return {
    // estado
    usuarios,
    loading,
    mostrarModal,
    filtroRol,
    busqueda,
    mensaje,
    errorMensaje,
    formData,
    rolesList,
    identificacionesList,
    resetUserId,
    resetPasswordVal,
    // acciones
    setMostrarModal,
    setFiltroRol,
    setBusqueda,
    handleCambiarRol,
    handleToggleEstado,
    handleFormChange,
    handleCrearUsuario,
    handleBuscar,
    handleLimpiarBusqueda,
    handleEliminarUsuario,
    setResetUserId,
    setResetPasswordVal,
    handleResetPassword,
  }
}
