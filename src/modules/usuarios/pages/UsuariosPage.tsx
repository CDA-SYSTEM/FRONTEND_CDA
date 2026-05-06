import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { usuarioService } from '../usuarioService'
import type { CrearUsuarioDTO, RolUsuario, RolUsuarioForm, Usuario } from '../usuario.types'

const ROLES: RolUsuario[] = ['ADMIN', 'RECEPCIONISTA', 'INSPECTOR', 'FACTURADOR']
const ROLE_FILTERS: Array<{ label: string; value: '' | RolUsuario }> = [
  { label: 'Todos', value: '' },
  { label: 'Admin', value: 'ADMIN' },
  { label: 'Recepcionista', value: 'RECEPCIONISTA' },
  { label: 'Inspector', value: 'INSPECTOR' },
  { label: 'Facturador', value: 'FACTURADOR' },
]

export function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(false)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [filtroRol, setFiltroRol] = useState<'' | RolUsuario>('')
  const [busqueda, setBusqueda] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [errorMensaje, setErrorMensaje] = useState('')
  const [formData, setFormData] = useState<CrearUsuarioDTO>({
    identificationType: 'cc',
    identificationNumber: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    password: '',
    role: 'inspector',
  })

  const cargarUsuarios = async () => {
    try {
      setLoading(true)
      setErrorMensaje('')
      const data = await usuarioService.obtenerUsuarios(filtroRol || undefined)
      setUsuarios(data)
    } catch (error) {
      console.error('Error al cargar usuarios:', error)
      setErrorMensaje('No se pudo cargar la lista de usuarios.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarUsuarios()
  }, [filtroRol])

  const handleCambiarRol = async (id: string, nuevoRol: RolUsuario) => {
    const confirmar = window.confirm(`¿Confirmas cambiar el rol a ${nuevoRol}?`)
    if (!confirmar) return

    try {
      setMensaje('')
      setErrorMensaje('')
      await usuarioService.cambiarRol(id, { role: nuevoRol })
      setMensaje('Rol actualizado correctamente.')
      cargarUsuarios()
    } catch (error) {
      console.error('Error cambiando rol', error)
      setErrorMensaje('No se pudo actualizar el rol.')
    }
  }

  const handleToggleEstado = async (usuario: Usuario) => {
    const accion = usuario.isActive ? 'desactivar' : 'activar'
    const confirmar = window.confirm(`¿Confirmas ${accion} este usuario?`)
    if (!confirmar) return

    try {
      setMensaje('')
      setErrorMensaje('')
      await usuarioService.cambiarEstado(usuario.id, !usuario.isActive)
      setMensaje(`Usuario ${usuario.isActive ? 'desactivado' : 'activado'} correctamente.`)
      cargarUsuarios()
    } catch (error) {
      console.error('Error cambiando estado', error)
      setErrorMensaje('No se pudo cambiar el estado del usuario.')
    }
  }

  const handleChange = (e: { target: { name: string; value: string } }) => {
    const { name, value } = e.target
    if (name === 'role') {
      setFormData({ ...formData, role: value as RolUsuarioForm })
      return
    }
    setFormData({ ...formData, [name]: value })
  }

  const handleCrearUsuario = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    try {
      setMensaje('')
      setErrorMensaje('')
      await usuarioService.crearUsuario(formData)
      setMostrarModal(false)
      setFormData({
        identificationType: 'cc',
        identificationNumber: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        email: '',
        password: '',
        role: 'inspector',
      })
      setMensaje('Usuario creado correctamente.')
      cargarUsuarios()
    } catch (error) {
      console.error('Error al crear usuario', error)
      setErrorMensaje('Hubo un error al registrar el usuario.')
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
      setMensaje('')
      setErrorMensaje('')
      const results = await usuarioService.buscarUsuarios(term)
      setUsuarios(results)
      if (results.length === 0) {
        setMensaje('No se encontraron usuarios para la búsqueda.')
      }
    } catch (error) {
      console.error('Error buscando usuarios', error)
      setErrorMensaje('No se pudo realizar la búsqueda.')
    } finally {
      setLoading(false)
    }
  }

  const handleEliminarUsuario = async (id: string) => {
    const confirmar = window.confirm('¿Seguro que deseas eliminar este usuario? Esta acción no se puede deshacer.')
    if (!confirmar) return

    try {
      setMensaje('')
      setErrorMensaje('')
      await usuarioService.eliminarUsuario(id)
      setMensaje('Usuario eliminado correctamente.')
      cargarUsuarios()
    } catch (error) {
      console.error('Error eliminando usuario', error)
      setErrorMensaje('No se pudo eliminar el usuario.')
    }
  }

  if (loading && usuarios.length === 0) return <p>Cargando usuarios...</p>

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Gestión de Usuarios</h2>
          <p>Administra los accesos y roles del sistema.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre/correo/documento"
            style={{ padding: '8px', borderRadius: '6px', minWidth: '260px' }}
          />
          <button
            onClick={handleBuscar}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
          >
            Buscar
          </button>
          <button
            onClick={() => {
              setBusqueda('')
              setMensaje('')
              setErrorMensaje('')
              cargarUsuarios()
            }}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
          >
            Limpiar
          </button>
          <select
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value as '' | RolUsuario)}
            style={{ padding: '8px', borderRadius: '6px' }}
          >
            {ROLE_FILTERS.map((item) => (
              <option key={item.label} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        <button
          onClick={() => setMostrarModal(true)}
          style={{ padding: '10px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
        >
          + Nuevo Usuario
        </button>
        </div>
      </div>

      {mensaje && (
        <p style={{ marginTop: '12px', padding: '10px', borderRadius: '6px', background: '#ecfdf5', color: '#065f46' }}>
          {mensaje}
        </p>
      )}
      {errorMensaje && (
        <p style={{ marginTop: '12px', padding: '10px', borderRadius: '6px', background: '#fef2f2', color: '#991b1b' }}>
          {errorMensaje}
        </p>
      )}

      <table border={1} cellPadding={10} style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Nombre Completo</th>
            <th>Email</th>
            <th>Rol Actual</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map(user => (
            <tr key={user.id}>
              <td>{user.firstName ? `${user.firstName} ${user.lastName}` : user.name}</td>
              <td>{user.email}</td>
              <td>
                <select value={user.role} onChange={(e) => handleCambiarRol(user.id, e.target.value as RolUsuario)}>
                  {ROLES.map(rol => <option key={rol} value={rol}>{rol}</option>)}
                </select>
              </td>
              <td>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                  {user.isActive ? (
                    <>
                      <CheckCircle2 size={16} color="#16a34a" />
                      <span style={{ color: '#166534' }}>Activo</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={16} color="#dc2626" />
                      <span style={{ color: '#991b1b' }}>Inactivo</span>
                    </>
                  )}
                </span>
              </td>
              <td style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleToggleEstado(user)}>{user.isActive ? 'Desactivar' : 'Activar'}</button>
                <button
                  onClick={() => handleEliminarUsuario(user.id)}
                  style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer' }}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {mostrarModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', width: '100%', maxWidth: '450px' }}>
            <h3 style={{ marginTop: 0 }}>Crear Nuevo Usuario</h3>
            <form onSubmit={handleCrearUsuario} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <label style={{ flex: 1 }}>Tipo Doc.
                  <select name="identificationType" value={formData.identificationType} onChange={handleChange} style={{ width: '100%', padding: '8px', marginTop: '4px' }}>
                    <option value="cc">Cédula (CC)</option>
                    <option value="ce">Cédula Ext. (CE)</option>
                    <option value="nit">NIT</option>
                  </select>
                </label>
                <label style={{ flex: 2 }}>Número
                  <input type="text" name="identificationNumber" required value={formData.identificationNumber} onChange={handleChange} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <label style={{ flex: 1 }}>Nombres
                  <input type="text" name="firstName" required value={formData.firstName} onChange={handleChange} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
                </label>
                <label style={{ flex: 1 }}>Apellidos
                  <input type="text" name="lastName" required value={formData.lastName} onChange={handleChange} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
                </label>
              </div>

              <label>Teléfono
                <input type="tel" name="phoneNumber" required value={formData.phoneNumber} onChange={handleChange} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
              </label>

              <label>Correo Electrónico
                <input type="email" name="email" required value={formData.email} onChange={handleChange} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
              </label>

              <label>Contraseña
                <input type="password" name="password" required value={formData.password} onChange={handleChange} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
              </label>

              <label>Rol
                <select name="role" value={formData.role} onChange={handleChange} style={{ width: '100%', padding: '8px', marginTop: '4px' }}>
                  <option value="admin">Administrador</option>
                  <option value="recepcionista">Recepcionista</option>
                  <option value="inspector">Inspector</option>
                  <option value="facturador">Facturador</option>
                </select>
              </label>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setMostrarModal(false)} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc', background: '#f3f4f6', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, padding: '10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
