import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useFlash } from './flash/FlashContext';

/**
 * Componente que escucha eventos de sesión expirada y redirige al login
 * Debe ser incluido en App.js para funcionar globalmente
 */
export default function SessionGuard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const flash = useFlash();

  useEffect(() => {
    const handleSessionExpired = () => {
      console.log('Sesión expirada detectada - redirigiendo a login');

      // Limpiar el contexto de autenticación
      logout();

      // Mostrar mensaje al usuario
      if (flash?.show) {
        flash.show('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', 'error', 4000);
      }

      // Redirigir a la página de login
      navigate('/signin', {
        replace: true,
        state: {
          flash: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
          flashType: 'error'
        }
      });
    };

    // Escuchar el evento personalizado disparado por api.js
    window.addEventListener('session-expired', handleSessionExpired);

    // Limpiar el listener al desmontar
    return () => {
      window.removeEventListener('session-expired', handleSessionExpired);
    };
  }, [navigate, logout, flash]);

  // Este componente no renderiza nada
  return null;
}
