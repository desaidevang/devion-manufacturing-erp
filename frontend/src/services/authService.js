// src/services/authService.js
import axiosInstance from '../api/axios';

export const authService = {
  login: async (username, password) => {
    try {
      console.log('Attempting login with:', { username });
      
      const response = await axiosInstance.post('/auth/login', {
        username,
        password,
      });
      
      console.log('Login response:', response.data);
      
      if (response.data.token) {
        localStorage.setItem('access_token', response.data.token);
        localStorage.setItem('user_data', JSON.stringify({
          username: response.data.username,
          email: response.data.email,
          fullName: response.data.fullName,
          role: response.data.role,
        }));
      }
      
      return response.data;
    } catch (error) {
      console.error('Login error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  },
  login: async (username, password) => {
    const response = await axiosInstance.post('/auth/login', {
      username,
      password,
    });
    
    if (response.data.token) {
      localStorage.setItem('access_token', response.data.token);
      localStorage.setItem('user_data', JSON.stringify({
        username: response.data.username,
        email: response.data.email,
        fullName: response.data.fullName,
        role: response.data.role,
      }));
    }
    
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    window.location.href = '/login';
  },
  
  getCurrentUser: () => {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  },
  
  getToken: () => {
    return localStorage.getItem('access_token');
  },
  
  isAuthenticated: () => {
    const token = localStorage.getItem('access_token');
    return !!token;
  },
  
  validateToken: async () => {
    try {
      const response = await axiosInstance.get('/auth/validate-token');
      return response.data;
    } catch (error) {
      return false;
    }
  },
};