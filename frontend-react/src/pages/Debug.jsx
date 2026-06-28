import { useEffect, useState } from 'react';

export default function Debug() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const t = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    setToken(t);
    setUser(u ? JSON.parse(u) : null);
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Debug Info</h1>
      <h2>Token:</h2>
      <pre>{token || 'Pas de token'}</pre>
      
      <h2>User:</h2>
      <pre>{user ? JSON.stringify(user, null, 2) : 'Pas d\'utilisateur'}</pre>
      
      <h2>Test API /me:</h2>
      <button onClick={async () => {
        const res = await fetch('http://localhost:8000/api/me', {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        alert(JSON.stringify(data, null, 2));
      }}>Tester API /me</button>
    </div>
  );
}