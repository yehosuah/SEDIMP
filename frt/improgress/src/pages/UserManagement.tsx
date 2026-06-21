import { useState, useEffect } from 'react';
import { api, type User, type Role } from '../lib/api';

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Modals state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFullName, setInviteFullName] = useState('');
  const [inviteRoleId, setInviteRoleId] = useState<number>(3); // Default to visor/editor or loaded role
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');

  // Edit form state
  const [editFullName, setEditFullName] = useState('');
  const [editRoleId, setEditRoleId] = useState<number>(3);
  const [editIsActive, setEditIsActive] = useState(true);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [usersData, rolesData] = await Promise.all([
        api.get<User[]>('/api/v1/management/users'),
        api.get<Role[]>('/api/v1/management/roles'),
      ]);
      setUsers(usersData);
      setRoles(rolesData);
      if (rolesData.length > 0) {
        // set default invite role to the lowest permission or visor
        const visorRole = rolesData.find(r => r.name === 'visor');
        if (visorRole) setInviteRoleId(visorRole.id);
        else setInviteRoleId(rolesData[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los datos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      loadData();
    });
  }, []);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccessMsg('');
    setInviteLoading(true);
    try {
      await api.post('/api/v1/management/users', {
        email: inviteEmail,
        full_name: inviteFullName || null,
        role_id: inviteRoleId,
      });
      setInviteSuccessMsg(`Usuario ${inviteEmail} invitado exitosamente. Se ha impreso el enlace en la consola del backend.`);
      setInviteEmail('');
      setInviteFullName('');
      // Reload users list
      const updatedUsers = await api.get<User[]>('/api/v1/management/users');
      setUsers(updatedUsers);
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Error al invitar al usuario.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setEditFullName(user.full_name || '');
    setEditRoleId(user.role.id);
    setEditIsActive(user.is_active);
    setEditError('');
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setEditError('');
    setEditLoading(true);
    try {
      const updated = await api.patch<User>(`/api/v1/management/users/${selectedUser.id}`, {
        full_name: editFullName || null,
        role_id: editRoleId,
        is_active: editIsActive,
      });
      setUsers(prev => prev.map(u => (u.id === selectedUser.id ? updated : u)));
      setIsEditOpen(false);
      setSelectedUser(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Error al actualizar el usuario.');
    } finally {
      setEditLoading(false);
    }
  };

  const toggleUserStatus = async (user: User) => {
    const actionStr = user.is_active ? 'desactivar' : 'activar';
    if (!confirm(`¿Estás seguro de que deseas ${actionStr} a ${user.email}?`)) return;
    try {
      const updated = await api.patch<User>(`/api/v1/management/users/${user.id}`, {
        is_active: !user.is_active,
      });
      setUsers(prev => prev.map(u => (u.id === user.id ? updated : u)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al cambiar estado.');
    }
  };

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name && u.full_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#111827', margin: 0 }}>
          Gestión de Usuarios
        </h1>
        <button
          onClick={() => {
            setInviteError('');
            setInviteSuccessMsg('');
            setIsInviteOpen(true);
          }}
          style={{
            height: '38px',
            padding: '0 18px',
            border: 'none',
            borderRadius: '8px',
            background: '#111827',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            letterSpacing: '0.2px',
            transition: 'opacity 120ms ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          INVITAR USUARIO
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          placeholder="Buscar por correo o nombre..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%',
            height: '40px',
            padding: '0 14px',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#111827',
            background: '#FFFFFF',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Loading/Error State */}
      {loading && <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>Cargando usuarios...</p>}
      {error && <p style={{ fontSize: '13px', color: '#DC2626', marginBottom: '8px' }}>{error}</p>}
      {!loading && !error && (
        <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>
          Mostrando {filteredUsers.length} de {users.length} usuarios
        </p>
      )}

      {/* Users Table */}
      <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E5E7EB', background: '#FAFAFA' }}>
              <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Usuario
              </th>
              <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Rol
              </th>
              <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Estado
              </th>
              <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Último Acceso
              </th>
              <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user, i) => (
              <tr
                key={user.id}
                style={{ borderBottom: i < filteredUsers.length - 1 ? '1px solid #F3F4F6' : 'none' }}
              >
                <td style={{ padding: '18px 24px' }}>
                  <div style={{ fontWeight: 600, color: '#111827', fontSize: '14px' }}>
                    {user.full_name || 'Sin nombre'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>
                    {user.email}
                  </div>
                </td>
                <td style={{ padding: '18px 24px' }}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    background: user.role.name === 'admin' ? '#EEF2FF' : user.role.name === 'editor' ? '#FDF2F8' : '#F3F4F6',
                    color: user.role.name === 'admin' ? '#4F46E5' : user.role.name === 'editor' ? '#DB2777' : '#4B5563',
                  }}>
                    {user.role.name}
                  </span>
                </td>
                <td style={{ padding: '18px 24px' }}>
                  <span style={{
                    padding: '2px 10px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: user.is_active ? '#D1FAE5' : '#FEE2E2',
                    color: user.is_active ? '#065F46' : '#991B1B',
                  }}>
                    {user.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td style={{ padding: '18px 24px', fontSize: '13px', color: '#6B7280' }}>
                  {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Nunca'}
                </td>
                <td style={{ padding: '18px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      onClick={() => handleEditClick(user)}
                      style={{
                        padding: '5px 14px',
                        border: '1.5px solid #6366F1',
                        borderRadius: '6px',
                        background: 'transparent',
                        color: '#6366F1',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'background 120ms ease',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#EEF2FF')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => toggleUserStatus(user)}
                      style={{
                        padding: '5px 14px',
                        border: '1.5px solid #E5E7EB',
                        borderRadius: '6px',
                        background: 'transparent',
                        color: user.is_active ? '#EF4444' : '#10B981',
                        borderColor: user.is_active ? '#FCA5A5' : '#A7F3D0',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'background 120ms ease',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = user.is_active ? '#FEF2F2' : '#F0FDF4')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {user.is_active ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && filteredUsers.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>
                  No se encontraron usuarios
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Invite Modal */}
      {isInviteOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            width: '100%', maxWidth: '440px', backgroundColor: '#FFFFFF',
            borderRadius: '16px', padding: '36px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
            position: 'relative'
          }}>
            <button
              onClick={() => setIsInviteOpen(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', fontSize: '20px', color: '#9CA3AF', cursor: 'pointer' }}
            >
              &times;
            </button>
            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px', color: '#111111' }}>Invitar Usuario</h2>
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px' }}>
              Registra un nuevo usuario en el sistema. Recibirá una invitación para establecer su contraseña.
            </p>

            {inviteSuccessMsg && (
              <div style={{ padding: '12px 14px', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', fontSize: '13px', color: '#15803D', marginBottom: '16px', lineHeight: '1.4' }}>
                {inviteSuccessMsg}
              </div>
            )}

            <form onSubmit={handleInviteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Correo Electrónico *</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  required
                  style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: '8px', border: '1.5px solid #E5E7EB', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Nombre Completo</label>
                <input
                  type="text"
                  value={inviteFullName}
                  onChange={e => setInviteFullName(e.target.value)}
                  style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: '8px', border: '1.5px solid #E5E7EB', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Rol *</label>
                <select
                  value={inviteRoleId}
                  onChange={e => setInviteRoleId(Number(e.target.value))}
                  style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: '8px', border: '1.5px solid #E5E7EB', outline: 'none', background: '#FFFFFF' }}
                >
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name.toUpperCase()} - {role.description}</option>
                  ))}
                </select>
              </div>

              {inviteError && (
                <div style={{ padding: '10px 12px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', fontSize: '13px', color: '#DC2626' }}>
                  {inviteError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  style={{ flex: 1, height: '42px', borderRadius: '8px', border: '1px solid #D1D5DB', backgroundColor: '#FFFFFF', color: '#374151', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  style={{ flex: 1, height: '42px', borderRadius: '8px', border: 'none', backgroundColor: '#111111', color: '#FFFFFF', cursor: 'pointer', fontWeight: 600, opacity: inviteLoading ? 0.7 : 1 }}
                >
                  {inviteLoading ? 'Enviando...' : 'Enviar Invitación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditOpen && selectedUser && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            width: '100%', maxWidth: '440px', backgroundColor: '#FFFFFF',
            borderRadius: '16px', padding: '36px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
            position: 'relative'
          }}>
            <button
              onClick={() => {
                setIsEditOpen(false);
                setSelectedUser(null);
              }}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', fontSize: '20px', color: '#9CA3AF', cursor: 'pointer' }}
            >
              &times;
            </button>
            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px', color: '#111111' }}>Editar Usuario</h2>
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px' }}>
              Modificando perfil para: <strong style={{ color: '#111' }}>{selectedUser.email}</strong>
            </p>

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Nombre Completo</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={e => setEditFullName(e.target.value)}
                  style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: '8px', border: '1.5px solid #E5E7EB', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Rol</label>
                <select
                  value={editRoleId}
                  onChange={e => setEditRoleId(Number(e.target.value))}
                  style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: '8px', border: '1.5px solid #E5E7EB', outline: 'none', background: '#FFFFFF' }}
                >
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name.toUpperCase()} - {role.description}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="edit-is-active"
                  checked={editIsActive}
                  onChange={e => setEditIsActive(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="edit-is-active" style={{ fontSize: '13px', fontWeight: 600, color: '#374151', cursor: 'pointer' }}>Usuario Activo</label>
              </div>

              {editError && (
                <div style={{ padding: '10px 12px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', fontSize: '13px', color: '#DC2626' }}>
                  {editError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditOpen(false);
                    setSelectedUser(null);
                  }}
                  style={{ flex: 1, height: '42px', borderRadius: '8px', border: '1px solid #D1D5DB', backgroundColor: '#FFFFFF', color: '#374151', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  style={{ flex: 1, height: '42px', borderRadius: '8px', border: 'none', backgroundColor: '#111111', color: '#FFFFFF', cursor: 'pointer', fontWeight: 600, opacity: editLoading ? 0.7 : 1 }}
                >
                  {editLoading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
