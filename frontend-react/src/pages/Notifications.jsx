import { useEffect, useState } from 'react';
import { getNotifications, markAsRead, markAllRead } from '../api/notification';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function Notifications() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchNotifs(); }, []);

  const fetchNotifs = () => getNotifications().then(res => setNotifs(res.data)).finally(() => setLoading(false));

  const handleMarkRead = async (id) => {
    await markAsRead(id);
    fetchNotifs();
    toast.success('Marquée comme lue');
  };

  const handleMarkAll = async () => {
    await markAllRead();
    fetchNotifs();
    toast.success('Toutes les notifications sont lues');
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <button onClick={handleMarkAll} className="text-blue-600 text-sm">Tout marquer comme lu</button>
      </div>
      {notifs.length === 0 ? <p>Aucune notification</p> : (
        <div className="space-y-2">
          {notifs.map(n => (
            <div key={n.id} className={`p-4 rounded shadow ${!n.lue ? 'bg-blue-50 border-l-4 border-blue-600' : 'bg-white'}`}>
              <p>{n.message}</p>
              <div className="flex justify-between items-center mt-2 text-sm">
                <span className="text-gray-500">{new Date(n.created_at).toLocaleString()}</span>
                {!n.lue && <button onClick={() => handleMarkRead(n.id)} className="text-blue-600">Marquer comme lue</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}