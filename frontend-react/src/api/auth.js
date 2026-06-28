import api from './axios';

export const login = (email, password) =>
  api.post('/login', { email, password });

export const register = (userData) =>
  api.post('/register', userData);

export const logout = () =>
  api.post('/logout');

export const getMe = () =>
  api.get('/me');