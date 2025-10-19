import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { TokenStorage } from '../utils/storage';

export default function RequireAuth({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar periódicamente si el token ha expirado
    const checkTokenExpiration = () => {
      if (TokenStorage.isTokenExpired()) {
        TokenStorage.removeToken();
        navigate('/signin', { 
          state: { 
            from: location,
            flash: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
            flashType: 'error'
          },
          replace: true 
        });
      }
    };

    // Verificar cada 30 segundos
    const interval = setInterval(checkTokenExpiration, 30000);
    
    // Verificar inmediatamente
    checkTokenExpiration();

    return () => clearInterval(interval);
  }, [navigate, location]);

  if (!TokenStorage.hasToken() || TokenStorage.isTokenExpired()) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return children;
}