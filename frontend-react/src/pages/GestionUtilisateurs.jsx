import { useEffect, useState } from 'react';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function GestionUtilisateurs() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = () => api.get('/admin/users').then(res => setUsers(res.data.data)).finally(() => setLoading(false));

  const handleDesactiver = async (id) => {
    if (confirm('Désactiver cet utilisateur ?')) {
      await api.delete(`/admin/users/${id}/desactiver`);
      toast.success('Utilisateur désactivé');
      fetchUsers();
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Supprimer définitivement ?')) {
      await api.delete(`/admin/users/${id}`);
      toast.success('Utilisateur supprimé');
      fetchUsers();
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Gestion des utilisateurs</h1>
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-100"><tr><th className="p-3 text-left">Nom</th><th>Email</th><th>Rôle</th><th>Actions</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t"><td className="p-3">{u.nom} {u.prenom}</td><td>{u.email}</td><td>{u.role}</td><td><button onClick={() => handleDesactiver(u.id)} className="text-orange-600 mr-2">Désactiver</button><button onClick={() => handleDelete(u.id)} className="text-red-600">Supprimer</button></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}