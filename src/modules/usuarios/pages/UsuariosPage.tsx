import { CheckCircle2, XCircle } from 'lucide-react'
import { useUsuarios } from '@/modules/usuarios/hooks/useUsuarios'
import type { RolUsuarioForm } from '@/modules/usuarios/domain/usuario.types'

const ROLES: { label: string; value: RolUsuarioForm }[] = [
  { label: 'Administrador', value: 'admin' },
  { label: 'Manager', value: 'manager' },
  { label: 'Inspector', value: 'inspector' },
  { label: 'Operario', value: 'operario' },
]
const ROLE_FILTERS: Array<{ label: string; value: '' | RolUsuarioForm }> = [
  { label: 'Todos', value: '' },
  { label: 'Administrador', value: 'admin' },
  { label: 'Manager', value: 'manager' },
  { label: 'Inspector', value: 'inspector' },
  { label: 'Operario', value: 'operario' },
]

/**
 * Página de gestión de usuarios.
 * Solo contiene JSX — toda la lógica vive en useUsuarios (capa de aplicación).
 */
export function UsuariosPage() {
  const {
    usuarios,
    loading,
    mostrarModal,
    filtroRol,
    busqueda,
    mensaje,
    errorMensaje,
    formData,
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
  } = useUsuarios()

  if (loading && usuarios.length === 0) return <p>Cargando usuarios...</p>

  return (
    <div style={{ padding: '20px' }}>
      {/* Cabecera */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
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
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              cursor: 'pointer',
            }}
          >
            Buscar
          </button>
          <button
            onClick={handleLimpiarBusqueda}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              cursor: 'pointer',
            }}
          >
            Limpiar
          </button>
          <select
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value as '' | RolUsuarioForm)}
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
            style={{
              padding: '10px 16px',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            + Nuevo Usuario
          </button>
        </div>
      </div>

      {/* Feedback */}
      {mensaje && (
        <p
          style={{
            marginTop: '12px',
            padding: '10px',
            borderRadius: '6px',
            background: '#ecfdf5',
            color: '#065f46',
          }}
        >
          {mensaje}
        </p>
      )}
      {errorMensaje && (
        <p
          style={{
            marginTop: '12px',
            padding: '10px',
            borderRadius: '6px',
            background: '#fef2f2',
            color: '#991b1b',
          }}
        >
          {errorMensaje}
        </p>
      )}

      {/* Tabla */}
      <table
        border={1}
        cellPadding={10}
        style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse' }}
      >
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
          {usuarios.map((user) => (
            <tr key={user.id}>
              <td>
                {user.firstName
                  ? `${user.firstName} ${user.lastName}`
                  : user.name}
              </td>
              <td>{user.email}</td>
              <td>
                <select
                  value={user.role.toLowerCase()}
                  onChange={(e) =>
                    handleCambiarRol(user.id, e.target.value as RolUsuarioForm)
                  }
                >
                  {ROLES.map((rol) => (
                    <option key={rol.value} value={rol.value}>
                      {rol.label}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 500,
                  }}
                >
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
                <button onClick={() => handleToggleEstado(user)}>
                  {user.isActive ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  onClick={() => handleEliminarUsuario(user.id)}
                  style={{
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 10px',
                    cursor: 'pointer',
                  }}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal crear usuario */}
      {mostrarModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '450px',
            }}
          >
            <h3 style={{ marginTop: 0 }}>Crear Nuevo Usuario</h3>
            <form
              onSubmit={handleCrearUsuario}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div style={{ display: 'flex', gap: '10px' }}>
                <label style={{ flex: 1 }}>
                  Tipo Doc.
                  <select
                    name="identificationType"
                    value={formData.identificationType}
                    onChange={handleFormChange}
                    style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                  >
                    <option value="cc">Cédula (CC)</option>
                    <option value="ce">Cédula Ext. (CE)</option>
                    <option value="nit">NIT</option>
                  </select>
                </label>
                <label style={{ flex: 2 }}>
                  Número
                  <input
                    type="text"
                    name="identificationNumber"
                    required
                    value={formData.identificationNumber}
                    onChange={handleFormChange}
                    style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                  />
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <label style={{ flex: 1 }}>
                  Nombres
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleFormChange}
                    style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                  />
                </label>
                <label style={{ flex: 1 }}>
                  Apellidos
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleFormChange}
                    style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                  />
                </label>
              </div>

              <label>
                Teléfono
                <input
                  type="tel"
                  name="phoneNumber"
                  required
                  value={formData.phoneNumber}
                  onChange={handleFormChange}
                  style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                />
              </label>

              <label>
                Correo Electrónico
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleFormChange}
                  style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                />
              </label>

              <label>
                Contraseña
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleFormChange}
                  style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                />
              </label>

              <label>
                Rol
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleFormChange}
                  style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                >
                  <option value="admin">Administrador</option>
                  <option value="manager">Manager</option>
                  <option value="inspector">Inspector</option>
                  <option value="operario">Operario</option>
                </select>
              </label>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #ccc',
                    background: '#f3f4f6',
                    color: '#374151',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
