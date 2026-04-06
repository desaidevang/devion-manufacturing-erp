// src/hooks/useProtectedRoute.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

export const useProtectedRoute = (requiredRole = null) => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      if (!authService.isAuthenticated()) {
        toast.error('Please login to continue');
        navigate('/login');
        return;
      }

      try {
        const isValid = await authService.validateToken();
        if (!isValid) {
          authService.logout();
          toast.error('Session expired. Please login again.');
          navigate('/login');
          return;
        }

        // Check role if required
        if (requiredRole) {
          const userData = authService.getCurrentUser();
          if (userData.role !== requiredRole) {
            toast.error('You do not have permission to access this page');
            navigate('/dashboard');
          }
        }
      } catch (error) {
        authService.logout();
        toast.error('Authentication error. Please login again.');
        navigate('/login');
      }
    };

    checkAuth();
  }, [navigate, requiredRole]);
};