import { createPortal } from 'react-dom'
import { CheckCircle2, XCircle, Key } from 'lucide-react'
import { useUsuarios } from '@/modules/usuarios/hooks/useUsuarios'
import type { RolUsuarioForm } from '@/modules/usuarios/domain/usuario.types'
import { CustomSelect } from '@/shared/components/CustomSelect'
import './UsuariosPage.css'
import './UsuariosModal.css'
import './RestablecerPasswordModal.css'

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
    rolesList,
    identificacionesList,
    resetUserId,
    resetPasswordVal,
    cuentas,
    tab,
    loadingCuentas,
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
    setTab,
  } = useUsuarios()

  const isLoading = tab === 'usuarios' ? (loading && usuarios.length === 0) : (loadingCuentas && cuentas.length === 0)

  return (
    <div className="usuarios-workspace">
      {/* Cabecera */}
      <div className="users-header">
        <div>
          <h2>Gestión de Usuarios</h2>
          <p>Administra los accesos y roles del sistema.</p>
        </div>
        <div className="users-actions-bar">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre/correo/documento"
          />
          <button
            onClick={handleBuscar}
            className="btn-filter-action"
          >
            Buscar
          </button>
          <button
            onClick={handleLimpiarBusqueda}
            className="btn-filter-action"
          >
            Limpiar
          </button>
          {tab === 'usuarios' && (
            <CustomSelect
              options={ROLE_FILTERS.map((item) => ({ value: item.value, label: item.label }))}
              value={filtroRol}
              onChange={(val) => setFiltroRol(val as '' | RolUsuarioForm)}
              placeholder="Todos los roles"
              style={{ minWidth: '160px' }}
            />
          )}
          <button
            onClick={() => setMostrarModal(true)}
            className="btn-create-user"
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
      {/* Tabs */}
      <div className="users-tabs-bar">
        <button
          onClick={() => setTab('usuarios')}
          className={`users-tab-btn ${tab === 'usuarios' ? 'users-tab-btn--active' : ''}`}
        >
          Personal (Usuarios)
        </button>
        <button
          onClick={() => setTab('cuentas')}
          className={`users-tab-btn ${tab === 'cuentas' ? 'users-tab-btn--active' : ''}`}
        >
          Cuentas de Acceso (Auth)
        </button>
      </div>

      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Cargando datos...</div>
      ) : tab === 'usuarios' ? (
        <>
          {/* Tabla de Usuarios */}
          <div className="usuarios-desktop-table-wrapper">
            <div className="usuarios-table-container">
              <table style={{ width: '100%' }}>
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
                      <td style={{ minWidth: '160px' }}>
                        <CustomSelect
                          options={ROLES.map((r) => ({ value: r.value, label: r.label }))}
                          value={user.role.toLowerCase()}
                          onChange={(val) => handleCambiarRol(user.id, val as RolUsuarioForm)}
                        />
                      </td>
                      <td>
                        {user.isActive ? (
                          <span className="status-badge-premium status-badge-premium--active">
                            <CheckCircle2 size={14} />
                            Activo
                          </span>
                        ) : (
                          <span className="status-badge-premium status-badge-premium--inactive">
                            <XCircle size={14} />
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                          <button
                            onClick={() => handleToggleEstado(user)}
                            style={{
                              padding: '4px 10px',
                              minHeight: 'auto',
                              borderRadius: '4px',
                              boxShadow: 'none',
                            }}
                          >
                            {user.isActive ? 'Desactivar' : 'Activar'}
                          </button>
                          <button
                            onClick={() => setResetUserId(user.id)}
                            className="usr-btn-action usr-btn-action--key"
                          >
                            <Key size={13} />
                            Restablecer Clave
                          </button>
                          <button
                            onClick={() => handleEliminarUsuario(user.id)}
                            className="usr-btn-action usr-btn-action--delete"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tarjetas para móviles */}
          <div className="usuarios-mobile-cards-container">
            {usuarios.map((user) => (
              <div key={user.id} className="usuario-responsive-card">
                <div className="user-card-header">
                  <div className="user-card-name">
                    {user.firstName
                      ? `${user.firstName} ${user.lastName}`
                      : user.name}
                  </div>
                  <div className="user-card-email">{user.email}</div>
                </div>

                <div className="user-card-row">
                  <span className="user-card-label">Rol:</span>
                  <CustomSelect
                    options={ROLES.map((r) => ({ value: r.value, label: r.label }))}
                    value={user.role.toLowerCase()}
                    onChange={(val) => handleCambiarRol(user.id, val as RolUsuarioForm)}
                  />
                </div>

                <div className="user-card-row">
                  <span className="user-card-label">Estado:</span>
                  {user.isActive ? (
                    <span className="status-badge-premium status-badge-premium--active">
                      <CheckCircle2 size={14} />
                      Activo
                    </span>
                  ) : (
                    <span className="status-badge-premium status-badge-premium--inactive">
                      <XCircle size={14} />
                      Inactivo
                    </span>
                  )}
                </div>

                <div className="user-card-actions">
                  <button
                    onClick={() => handleToggleEstado(user)}
                    style={{
                      padding: '6px 12px',
                      minHeight: 'auto',
                      borderRadius: '6px',
                      boxShadow: 'none',
                      fontSize: '0.85rem',
                    }}
                  >
                    {user.isActive ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    onClick={() => setResetUserId(user.id)}
                    style={{
                      background: '#f1f5f9',
                      color: '#334155',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      minHeight: 'auto',
                      boxShadow: 'none',
                      fontSize: '0.85rem',
                    }}
                  >
                    <Key size={14} />
                    Clave
                  </button>
                  <button
                    onClick={() => handleEliminarUsuario(user.id)}
                    style={{
                      background: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      cursor: 'pointer',
                      minHeight: 'auto',
                      boxShadow: 'none',
                      fontSize: '0.85rem',
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Tabla de Cuentas */}
          <div className="usuarios-desktop-table-wrapper">
            <div className="usuarios-table-container">
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>ID Cuenta</th>
                    <th>Email / Cuenta</th>
                    <th>Rol Actual</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cuentas.map((cuenta) => (
                    <tr key={cuenta.id}>
                      <td className="usuarios-id-monospace">{cuenta.id.substring(0, 8)}...</td>
                      <td>{cuenta.email}</td>
                      <td>
                        {cuenta.role === 'superadmin' ? (
                          <span style={{ padding: '4px 8px', background: '#f1f5f9', borderRadius: '4px', fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>
                            Super Admin
                          </span>
                        ) : (
                          <CustomSelect
                            options={ROLES.map((r) => ({ value: r.value, label: r.label }))}
                            value={cuenta.role.toLowerCase()}
                            onChange={(val) => handleCambiarRol(cuenta.id, val as RolUsuarioForm)}
                          />
                        )}
                      </td>
                      <td>
                        {cuenta.isActive ? (
                          <span className="status-badge-premium status-badge-premium--active">
                            <CheckCircle2 size={14} />
                            Activo
                          </span>
                        ) : (
                          <span className="status-badge-premium status-badge-premium--inactive">
                            <XCircle size={14} />
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="usr-actions-cell">
                          <button
                            onClick={() => handleToggleEstado(cuenta)}
                            className="usr-btn-action usr-btn-action--toggle"
                          >
                            {cuenta.isActive ? 'Desactivar' : 'Activar'}
                          </button>
                          <button
                            onClick={() => setResetUserId(cuenta.id)}
                            className="usr-btn-action usr-btn-action--key"
                          >
                            <Key size={13} />
                            Restablecer Clave
                          </button>
                          {cuenta.role !== 'superadmin' && (
                            <button
                              onClick={() => handleEliminarUsuario(cuenta.id)}
                              className="usr-btn-action usr-btn-action--delete"
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tarjetas móviles para Cuentas */}
          <div className="usuarios-mobile-cards-container">
            {cuentas.map((cuenta) => (
              <div key={cuenta.id} className="usuario-responsive-card">
                <div className="user-card-header">
                  <div className="user-card-name">{cuenta.email}</div>
                  <div className="user-card-email" style={{ fontFamily: 'monospace' }}>ID: {cuenta.id}</div>
                </div>

                <div className="user-card-row">
                  <span className="user-card-label">Rol:</span>
                  {cuenta.role === 'superadmin' ? (
                    <span style={{ padding: '2px 6px', background: '#f1f5f9', borderRadius: '4px', fontSize: '0.85rem' }}>Super Admin</span>
                  ) : (
                    <CustomSelect
                      options={ROLES.map((r) => ({ value: r.value, label: r.label }))}
                      value={cuenta.role.toLowerCase()}
                      onChange={(val) => handleCambiarRol(cuenta.id, val as RolUsuarioForm)}
                    />
                  )}
                </div>

                <div className="user-card-row">
                  <span className="user-card-label">Estado:</span>
                  {cuenta.isActive ? (
                    <span className="status-badge-premium status-badge-premium--active">
                      <CheckCircle2 size={14} />
                      Activo
                    </span>
                  ) : (
                    <span className="status-badge-premium status-badge-premium--inactive">
                      <XCircle size={14} />
                      Inactivo
                    </span>
                  )}
                </div>

                <div className="user-card-actions">
                  <button
                    onClick={() => handleToggleEstado(cuenta)}
                    style={{
                      padding: '6px 12px',
                      minHeight: 'auto',
                      borderRadius: '6px',
                      boxShadow: 'none',
                      fontSize: '0.85rem',
                    }}
                  >
                    {cuenta.isActive ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    onClick={() => setResetUserId(cuenta.id)}
                    style={{
                      background: '#f1f5f9',
                      color: '#334155',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      minHeight: 'auto',
                      boxShadow: 'none',
                      fontSize: '0.85rem',
                    }}
                  >
                    <Key size={14} />
                    Clave
                  </button>
                  {cuenta.role !== 'superadmin' && (
                    <button
                      onClick={() => handleEliminarUsuario(cuenta.id)}
                      style={{
                        background: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        cursor: 'pointer',
                        minHeight: 'auto',
                        boxShadow: 'none',
                        fontSize: '0.85rem',
                      }}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal crear usuario */}
      {mostrarModal && createPortal(
        <div className="user-modal-overlay">
          <div className="user-modal-window">
            <h3 style={{ marginTop: 0 }}>Crear Nuevo Usuario</h3>
            <form
              onSubmit={handleCrearUsuario}
              className="user-form-grid"
            >
              <div className="user-form-row-doc">
                <div className="user-form-group">
                  <label className="user-form-label">
                    Tipo Doc.
                  </label>
                  <CustomSelect
                    options={identificacionesList.length > 0 ? identificacionesList.map(id => ({ value: id.code.toLowerCase(), label: id.name })) : [
                      { value: 'cc', label: 'Cédula (CC)' },
                      { value: 'ce', label: 'Cédula Ext. (CE)' },
                      { value: 'nit', label: 'NIT' }
                    ]}
                    value={formData.identificationType}
                    onChange={(val) => handleFormChange({ target: { name: 'identificationType', value: val } })}
                  />
                </div>
                <div className="user-form-group">
                  <label className="user-form-label">
                    Número
                  </label>
                  <input
                    type="text"
                    name="identificationNumber"
                    required
                    value={formData.identificationNumber}
                    onChange={handleFormChange}
                    className="user-form-input"
                  />
                </div>
              </div>

              <div className="user-form-row-2">
                <div className="user-form-group">
                  <label className="user-form-label">
                    Nombres
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleFormChange}
                    className="user-form-input"
                  />
                </div>
                <div className="user-form-group">
                  <label className="user-form-label">
                    Apellidos
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleFormChange}
                    className="user-form-input"
                  />
                </div>
              </div>

              <div className="user-form-group">
                <label className="user-form-label">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  required
                  value={formData.phoneNumber}
                  onChange={handleFormChange}
                  className="user-form-input"
                />
              </div>

              <div className="user-form-group">
                <label className="user-form-label">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleFormChange}
                  className="user-form-input"
                />
              </div>

              <div className="user-form-group">
                <label className="user-form-label">
                  Rol
                </label>
                <CustomSelect
                  options={rolesList.length > 0 ? rolesList.map(role => ({ value: role.code.toLowerCase(), label: role.name })) : [
                    { value: 'admin', label: 'Administrador' },
                    { value: 'manager', label: 'Manager' },
                    { value: 'inspector', label: 'Inspector' },
                    { value: 'operario', label: 'Operario' }
                  ]}
                  value={formData.role}
                  onChange={(val) => handleFormChange({ target: { name: 'role', value: val } })}
                />
              </div>

              <div className="user-modal-footer">
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  className="btn-premium-cancel-ghost"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-premium-save"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal restablecer contraseña */}
      {resetUserId && createPortal(
        <div className="pwd-modal-overlay">
          <div className="pwd-modal-window">
            <h3 className="pwd-modal-title">Restablecer Contraseña</h3>
            <p className="pwd-modal-desc">
              Defina la nueva contraseña temporal para la cuenta de este usuario.
            </p>
            <form onSubmit={handleResetPassword}>
              <div className="pwd-form-group">
                <label className="pwd-form-label">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  required
                  minLength={4}
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  className="pwd-form-input"
                />
              </div>
              <div className="pwd-modal-footer">
                <button
                  type="button"
                  onClick={() => {
                    setResetUserId(null)
                    setResetPasswordVal('')
                  }}
                  className="btn-pwd-cancel-ghost"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-pwd-confirm"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
