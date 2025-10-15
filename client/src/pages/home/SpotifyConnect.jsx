// client/src/pages/home/SpotifyConnect.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../../components/layout/GlassCard';
import Sidebar from '../../components/sidebar/Sidebar';

const SpotifyConnect = () => {
  const navigate = useNavigate();
  const [connecting, setConnecting] = useState(false);

  const handleConnect = () => {
    setConnecting(true);
    // Generar state aleatorio para seguridad
    const state = Math.random().toString(36).substring(7);
    localStorage.setItem('spotify_state', state);
    
    // Redirigir a backend para OAuth
    window.location.href = `http://127.0.0.1:8000/v1/auth/spotify?state=${state}`;
  };

  // Manejar callback de Spotify
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const savedState = localStorage.getItem('spotify_state');

    if (code && state === savedState) {
      // Guardar token (esto debe venir del callback del backend)
      const token = params.get('access_token');
      if (token) {
        localStorage.setItem('spotify_token', token);
        navigate('/home/analyze');
      }
    }
  }, []);

  return (
    <div className="spotify-connect-page gradient-bg">
      <Sidebar />
      
      <div className="spotify-content">
        <GlassCard variant="lilac" className="connect-card">
          <div className="spotify-icon">🎵</div>
          <h1>Conectar con Spotify</h1>
          <p>Para obtener recomendaciones musicales personalizadas</p>
          
          <button 
            className="connect-button glass-pink"
            onClick={handleConnect}
            disabled={connecting}
          >
            {connecting ? 'Conectando...' : 'Conectar con Spotify'}
          </button>
        </GlassCard>
      </div>
    </div>
  );
};

export default SpotifyConnect;