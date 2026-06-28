import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Ajoute cet interceptor
api.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        console.log('Interceptor token:', token); // Vérification
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => Promise.reject(error)
);

export default api;