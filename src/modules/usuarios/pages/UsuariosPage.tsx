import { CheckCircle2, XCircle, Key } from 'lucide-react'
import { useUsuarios } from '@/modules/usuarios/hooks/useUsuarios'
import type { RolUsuarioForm } from '@/modules/usuarios/domain/usuario.types'
import { CustomSelect } from '@/shared/components/CustomSelect'

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
    <div style={{ padding: '20px' }}>
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
            style={{
              padding: '8px',
              borderRadius: '6px',
              minWidth: '200px',
              flex: '1 1 auto',
              marginTop: 0,
              minHeight: 'auto',
            }}
          />
          <button
            onClick={handleBuscar}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              cursor: 'pointer',
              minHeight: 'auto',
              background: '#fff',
              color: '#334155',
              boxShadow: 'none',
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
              minHeight: 'auto',
              background: '#fff',
              color: '#334155',
              boxShadow: 'none',
            }}
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
            style={{
              padding: '8px 16px',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              minHeight: 'auto',
              boxShadow: 'none',
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
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #cbd5e1', paddingBottom: '10px', marginBottom: '20px' }}>
        <button
          onClick={() => setTab('usuarios')}
          style={{
            padding: '8px 16px',
            border: 'none',
            background: tab === 'usuarios' ? '#2563eb' : 'transparent',
            color: tab === 'usuarios' ? '#fff' : '#64748b',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: tab === 'usuarios' ? 'bold' : 'normal',
            boxShadow: 'none',
            minHeight: 'auto',
          }}
        >
          Personal (Usuarios)
        </button>
        <button
          onClick={() => setTab('cuentas')}
          style={{
            padding: '8px 16px',
            border: 'none',
            background: tab === 'cuentas' ? '#2563eb' : 'transparent',
            color: tab === 'cuentas' ? '#fff' : '#64748b',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: tab === 'cuentas' ? 'bold' : 'normal',
            boxShadow: 'none',
            minHeight: 'auto',
          }}
        >
          Cuentas de Acceso (Auth)
        </button>
      </div>

      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Cargando datos...</div>
      ) : tab === 'usuarios' ? (
        <>
          {/* Tabla de Usuarios */}
          <div className="table-wrap users-table-desktop" style={{ marginTop: '20px' }}>
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
                          style={{
                            background: '#f1f5f9',
                            color: '#334155',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            padding: '4px 10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            minHeight: 'auto',
                            boxShadow: 'none',
                          }}
                        >
                          <Key size={14} />
                          Restablecer Clave
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
                            minHeight: 'auto',
                            boxShadow: 'none',
                          }}
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

          {/* Tarjetas para móviles */}
          <div className="users-cards-mobile">
            {usuarios.map((user) => (
              <div key={user.id} className="user-card">
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
          <div className="table-wrap users-table-desktop" style={{ marginTop: '20px' }}>
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
                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{cuenta.id.substring(0, 8)}...</td>
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
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontWeight: 500,
                        }}
                      >
                        {cuenta.isActive ? (
                          <>
                            <CheckCircle2 size={16} color="#16a34a" />
                            <span style={{ color: '#166534' }}>Activa</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={16} color="#dc2626" />
                            <span style={{ color: '#991b1b' }}>Inactiva</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button
                          onClick={() => handleToggleEstado(cuenta)}
                          style={{
                            padding: '4px 10px',
                            minHeight: 'auto',
                            borderRadius: '4px',
                            boxShadow: 'none',
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
                            borderRadius: '4px',
                            padding: '4px 10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            minHeight: 'auto',
                            boxShadow: 'none',
                          }}
                        >
                          <Key size={14} />
                          Restablecer Clave
                        </button>
                        {cuenta.role !== 'superadmin' && (
                          <button
                            onClick={() => handleEliminarUsuario(cuenta.id)}
                            style={{
                              background: '#ef4444',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '4px 10px',
                              cursor: 'pointer',
                              minHeight: 'auto',
                              boxShadow: 'none',
                            }}
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

          {/* Tarjetas móviles para Cuentas */}
          <div className="users-cards-mobile">
            {cuentas.map((cuenta) => (
              <div key={cuenta.id} className="user-card">
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
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: 500,
                    }}
                  >
                    {cuenta.isActive ? (
                      <>
                        <CheckCircle2 size={16} color="#16a34a" />
                        <span style={{ color: '#166534' }}>Activa</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={16} color="#dc2626" />
                        <span style={{ color: '#991b1b' }}>Inactiva</span>
                      </>
                    )}
                  </span>
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
            zIndex: 10000,
          }}
        >
          <div
            style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '450px',
              boxSizing: 'border-box',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <h3 style={{ marginTop: 0 }}>Crear Nuevo Usuario</h3>
            <form
              onSubmit={handleCrearUsuario}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
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
                <div style={{ flex: 2 }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Número
                  </label>
                  <input
                    type="text"
                    name="identificationNumber"
                    required
                    value={formData.identificationNumber}
                    onChange={handleFormChange}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      outline: 'none',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Nombres
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleFormChange}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      outline: 'none',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Apellidos
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleFormChange}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      outline: 'none',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  required
                  value={formData.phoneNumber}
                  onChange={handleFormChange}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleFormChange}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
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

      {/* Modal restablecer contraseña */}
      {resetUserId && (
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
            zIndex: 10000,
          }}
        >
          <div
            style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '400px',
              boxSizing: 'border-box',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <h3 style={{ marginTop: 0 }}>Restablecer Contraseña</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 16 }}>
              Defina la nueva contraseña temporal para la cuenta de este usuario.
            </p>
            <form
              onSubmit={handleResetPassword}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <label>
                Nueva Contraseña
                <input
                  type="password"
                  required
                  minLength={4}
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  style={{
                    width: '100%',
                    padding: '8px',
                    marginTop: '4px',
                    borderRadius: '4px',
                    border: '1px solid #cbd5e1',
                  }}
                />
              </label>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setResetUserId(null)
                    setResetPasswordVal('')
                  }}
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
                    background: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
