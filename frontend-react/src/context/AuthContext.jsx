import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const register = async (userData) => {
    try {
      const response = await api.post('/register', userData);
      const { token, user: newUser } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
      toast.success('Compte créé avec succès');
      return true;
    } catch (error) {
      console.error(error);
      if (error.response) {
        toast.error(error.response.data.message || 'Erreur');
      } else {
        toast.error('Erreur réseau');
      }
      return false;
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/login', { email, password });
      const { token, user: loggedUser } = response.data;
 
      if (!loggedUser || !loggedUser.role) {
        throw new Error('Données utilisateur invalides');
      }
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(loggedUser));
      setUser(loggedUser);
      toast.success('Connecté avec succès');
      return loggedUser; 
      
    } catch (error) {
     
      console.error('❌ Erreur de connexion:', error.response?.data || error.message);
  
      const errorMessage = error.response?.data?.message || 'Erreur de connexion';
      toast.error(errorMessage);

      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Déconnecté');
  };

  const updateUser = (updatedData) => {
    setUser(prev => ({ ...prev, ...updatedData }));
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      localStorage.setItem('user', JSON.stringify({ ...userData, ...updatedData }));
    }
  };

  const refreshUser = async () => {
    try {
      const response = await api.get('/user');
      if (response.data) {
        const updatedUser = response.data;
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Erreur refreshUser:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      register, 
      login, 
      logout, 
      updateUser, 
      refreshUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};