import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSupabaseUser } from '../App';
import { supabase } from '../integrations/supabase/client';

type ProfileRow = {
  user_id: string;
  email?: string | null;
  nombre_completo?: string | null;
  username?: string | null;
  role?: string | null;
  created_at?: string | null;
};

type Stats = {
  totalUsuarios: number;
  admins: number;
  registradosHoy: number;
};

const initialStats: Stats = {
  totalUsuarios: 0,
  admins: 0,
  registradosHoy: 0,
};

export default function AdminDashboard() {
  const { user } = useSupabaseUser();
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [stats, setStats] = useState<Stats>(initialStats);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<ProfileRow | null>(null);
  const [editUser, setEditUser] = useState<ProfileRow | null>(null);
  const [editData, setEditData] = useState<Partial<ProfileRow>>({});

  const isAdmin =
    (user as any)?.role === 'admin' ||
    user?.email === 'franciscolorenzo2406@gmail.com';

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: usuarios } = await supabase.from('profiles').select('*');
      const safeUsers = (usuarios as ProfileRow[] | null) ?? [];
      const today = new Date().toISOString().slice(0, 10);

      const admins = safeUsers.filter((u) => u.role === 'admin').length;
      const registradosHoy = safeUsers.filter((u) => u.created_at?.startsWith(today)).length;

      setUsers(safeUsers);
      setStats({
        totalUsuarios: safeUsers.length,
        admins,
        registradosHoy,
      });
      setLoading(false);
    }

    fetchData();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.toLowerCase();
    return users.filter((u) =>
      (u.email || '').toLowerCase().includes(query) ||
      (u.nombre_completo || '').toLowerCase().includes(query) ||
      (u.username || '').toLowerCase().includes(query)
    );
  }, [users, search]);

  async function handleDeleteUser(id: string) {
    if (!window.confirm('¿Seguro que quieres eliminar este usuario?')) return;

    await supabase.from('profiles').delete().eq('user_id', id);
    setUsers((prev) => prev.filter((u) => u.user_id !== id));
    setSelectedUser((prev) => (prev?.user_id === id ? null : prev));
  }

  function handleEditUser(profile: ProfileRow) {
    setEditUser(profile);
    setEditData({ ...profile });
  }

  async function handleSaveEdit() {
    if (!editUser) return;

    await supabase.from('profiles').update(editData).eq('user_id', editUser.user_id);
    setUsers((prev) =>
      prev.map((u) => (u.user_id === editUser.user_id ? { ...u, ...editData } : u))
    );
    setEditUser(null);
  }

  function exportCSV(data: ProfileRow[]) {
    const header = ['ID', 'Email', 'Nombre', 'Username', 'Rol', 'Fecha de registro'];
    const rows = data.map((u) => [
      u.user_id,
      u.email || '',
      u.nombre_completo || '',
      u.username || '',
      u.role || 'user',
      u.created_at?.slice(0, 10) || '',
    ]);

    const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'usuarios.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  const fakeLogs = [
    { fecha: '2026-01-05', usuario: 'user1', accion: 'Login' },
    { fecha: '2026-01-05', usuario: 'admin', accion: 'Editó usuario' },
    { fecha: '2026-01-04', usuario: 'user2', accion: 'Registro' },
  ];

  if (!isAdmin) return <Navigate to="/" />;
  if (loading) return <div>Cargando...</div>;

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto' }}>
      <h1>Panel de Administración</h1>

      <section style={{ marginBottom: 32 }}>
        <h2>Estadísticas</h2>
        <ul>
          <li>Total de usuarios: {stats.totalUsuarios}</li>
          <li>Admins: {stats.admins}</li>
          <li>Registrados hoy: {stats.registradosHoy}</li>
        </ul>
        <button onClick={() => exportCSV(users)} style={{ margin: '8px 0' }}>
          Exportar usuarios a CSV
        </button>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2>Logs de actividad</h2>
        <table border={1} cellPadding={6}>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Usuario</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {fakeLogs.map((log, index) => (
              <tr key={index}>
                <td>{log.fecha}</td>
                <td>{log.usuario}</td>
                <td>{log.accion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Usuarios Registrados</h2>
        <input
          type="text"
          placeholder="Buscar usuario..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginBottom: 12, padding: 6, width: 250 }}
        />

        <table border={1} cellPadding={8} style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Nombre</th>
              <th>Username</th>
              <th>Rol</th>
              <th>Fecha de registro</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr
                key={u.user_id}
                style={{
                  background: selectedUser?.user_id === u.user_id ? '#eef' : undefined,
                }}
              >
                <td>{u.user_id}</td>
                <td>{u.email}</td>
                <td>{u.nombre_completo}</td>
                <td>{u.username}</td>
                <td>{u.role || 'user'}</td>
                <td>{u.created_at?.slice(0, 10)}</td>
                <td>
                  <button onClick={() => setSelectedUser(u)}>Ver</button>{' '}
                  <button onClick={() => handleEditUser(u)}>Editar</button>{' '}
                  <button
                    onClick={() => handleDeleteUser(u.user_id)}
                    style={{ color: 'red' }}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {selectedUser && (
          <div
            style={{
              marginTop: 24,
              padding: 16,
              border: '1px solid #ccc',
              background: '#fafafa',
            }}
          >
            <h3>Detalles de usuario</h3>
            <p><b>ID:</b> {selectedUser.user_id}</p>
            <p><b>Email:</b> {selectedUser.email}</p>
            <p><b>Nombre:</b> {selectedUser.nombre_completo}</p>
            <p><b>Username:</b> {selectedUser.username}</p>
            <p><b>Rol:</b> {selectedUser.role || 'user'}</p>
            <p><b>Fecha de registro:</b> {selectedUser.created_at?.slice(0, 10)}</p>
            <button onClick={() => setSelectedUser(null)}>Cerrar</button>
          </div>
        )}

        {editUser && (
          <div
            style={{
              marginTop: 24,
              padding: 16,
              border: '1px solid #ccc',
              background: '#f5f5ff',
            }}
          >
            <h3>Editar usuario</h3>
            <label>
              Email:{' '}
              <input
                value={editData.email || ''}
                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
              />
            </label>
            <br />
            <label>
              Nombre:{' '}
              <input
                value={editData.nombre_completo || ''}
                onChange={(e) =>
                  setEditData({ ...editData, nombre_completo: e.target.value })
                }
              />
            </label>
            <br />
            <label>
              Username:{' '}
              <input
                value={editData.username || ''}
                onChange={(e) => setEditData({ ...editData, username: e.target.value })}
              />
            </label>
            <br />
            <label>
              Rol:{' '}
              <input
                value={editData.role || ''}
                onChange={(e) => setEditData({ ...editData, role: e.target.value })}
              />
            </label>
            <br />
            <button onClick={handleSaveEdit}>Guardar</button>{' '}
            <button onClick={() => setEditUser(null)}>Cancelar</button>
          </div>
        )}
      </section>
    </div>
  );
}
