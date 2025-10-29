import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../../components/sidebar/Sidebar';
import GlassCard from '../../components/layout/GlassCard';
import { useFlash } from '../../components/flash/FlashContext';
import './ResultsPage.css';

const ResultsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const flash = useFlash();
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [savingPlaylist, setSavingPlaylist] = useState(false);

  const { result, photo } = location.state || {};

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    try {
      const protectedUrl = `http://127.0.0.1:8000/recommend?emotion=${result.emotion}`;
      let response = await fetch(protectedUrl, { credentials: 'include' });

      if (!response.ok) {
        // Fallback to mockup if protected endpoint fails
        const fallbackUrl = `http://127.0.0.1:8000/recommend/mockup?emotion=${result.emotion}`;
        response = await fetch(fallbackUrl);
      }

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.tracks || []);
        console.log('✅ Recomendaciones cargadas:', data.tracks?.length || 0);
      } else {
        console.error('❌ Error al cargar recomendaciones:', response.status);
      }
    } catch (error) {
      console.error('❌ Error:', error);
    } finally {
      setLoading(false);
    }
  }, [result?.emotion]);

  // Verificar conexión de Spotify
  const checkSpotifyConnection = useCallback(async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/v1/auth/spotify/status', {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setSpotifyConnected(data.connected || false);
      }
    } catch (error) {
      console.error('Error verificando conexión de Spotify:', error);
      setSpotifyConnected(false);
    }
  }, []);

  useEffect(() => {
    if (!result || !photo) {
      navigate('/home/analyze');
      return;
    }
    fetchRecommendations();
    checkSpotifyConnection();
  }, [result, photo, navigate, fetchRecommendations, checkSpotifyConnection]);

  // Función para guardar playlist en Spotify
  const handleSavePlaylist = async () => {
    // Verificar conexión de Spotify
    if (!spotifyConnected) {
      sessionStorage.setItem('return_to', '/home/results');
      sessionStorage.setItem('connect_reason', 'save_playlist');
      sessionStorage.setItem('playlist_data', JSON.stringify({
        emotion: result.emotion,
        recommendations: recommendations
      }));

      if (flash?.show) {
        flash.show('Conecta tu cuenta de Spotify para guardar la playlist', 'info', 3000);
      }

      navigate('/home/spotify-connect');
      return;
    }

    // Si está conectado, crear la playlist
    setSavingPlaylist(true);

    try {
      const trackUris = recommendations
        .filter(track => track.uri)
        .map(track => track.uri);

      if (trackUris.length === 0) {
        if (flash?.show) {
          flash.show('No hay canciones disponibles para guardar', 'error', 3000);
        }
        return;
      }

      const token = sessionStorage.getItem('access_token');
      const response = await fetch('http://127.0.0.1:8000/recommend/create-playlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          emotion: result.emotion,
          track_uris: trackUris,
          analisis_id: result.analisis_id
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (flash?.show) {
          flash.show(`¡Playlist "${data.playlist_name}" creada exitosamente!`, 'success', 4000);
        }

        // Abrir playlist en Spotify
        if (data.playlist_url) {
          window.open(data.playlist_url, '_blank');
        }
      } else {
        // Si el token expiró, redirigir a reconectar
        if (response.status === 401) {
          setSpotifyConnected(false);
          if (flash?.show) {
            flash.show('Tu sesión de Spotify expiró. Por favor, vuelve a conectarte', 'error', 4000);
          }
          sessionStorage.setItem('return_to', '/home/results');
          sessionStorage.setItem('connect_reason', 'save_playlist');
          navigate('/home/spotify-connect');
        } else {
          if (flash?.show) {
            flash.show(data.message || 'Error al crear la playlist', 'error', 3000);
          }
        }
      }
    } catch (error) {
      console.error('Error guardando playlist:', error);
      if (flash?.show) {
        flash.show('Error al guardar la playlist. Por favor, intenta de nuevo', 'error', 3000);
      }
    } finally {
      setSavingPlaylist(false);
    }
  };

  // 🎨 Obtener color según emoción
  const getEmotionColor = (emotion) => {
    const colors = {
      happy: {
        primary: '#FFF200',
        secondary: '#FFD700',
        gradient: 'linear-gradient(135deg, #FFF200 0%, #FFD700 100%)',
        glassBg: 'rgba(255, 242, 0, 0.15)',
        glassBorder: 'rgba(255, 242, 0, 0.3)'
      },
      sad: {
        primary: '#0088FF',
        secondary: '#0066CC',
        gradient: 'linear-gradient(135deg, #0088FF 0%, #0066CC 100%)',
        glassBg: 'rgba(0, 136, 255, 0.15)',
        glassBorder: 'rgba(0, 136, 255, 0.3)'
      },
      angry: {
        primary: '#C97676',
        secondary: '#d89898',
        gradient: 'linear-gradient(135deg, #C97676 0%, #d89898 100%)',
        glassBg: 'rgba(201, 118, 118, 0.15)',
        glassBorder: 'rgba(201, 118, 118, 0.3)'
      },
      relaxed: {
        primary: '#a1a2e6',
        secondary: '#8B8CF5',
        gradient: 'linear-gradient(135deg, #a1a2e6 0%, #8B8CF5 100%)',
        glassBg: 'rgba(161, 162, 230, 0.15)',
        glassBorder: 'rgba(161, 162, 230, 0.3)'
      },
      energetic: {
        primary: '#e7a3c4',
        secondary: '#FF9EC7',
        gradient: 'linear-gradient(135deg, #e7a3c4 0%, #FF9EC7 100%)',
        glassBg: 'rgba(231, 163, 196, 0.15)',
        glassBorder: 'rgba(231, 163, 196, 0.3)'
      }
    };
    return colors[emotion] || colors.happy;
  };

  const getEmotionEmoji = (emotion) => {
    const emojis = {
      happy: '😊',
      sad: '😢',
      angry: '😠',
      relaxed: '😌',
      energetic: '⚡'
    };
    return emojis[emotion] || '🎭';
  };

  const getEmotionLabel = (emotion) => {
    const labels = {
      happy: 'Feliz',
      sad: 'Triste',
      angry: 'Enojado',
      relaxed: 'Relajado',
      energetic: 'Energético'
    };
    return labels[emotion] || emotion;
  };

  if (!result) {
    return (
      <div className="results-page gradient-bg">
        <div className="results-content">Cargando...</div>
      </div>
    );
  }

  const emotionColors = getEmotionColor(result.emotion);

  return (
    <div className="results-page gradient-bg">
      <Sidebar />
      
      <div className="results-content">
        {/* Header con botones de acciones */}
        <div className="results-header-section">
          <div className="results-header">
            <h1 className="results-title">Resultados del Análisis</h1>
            <p className="results-subtitle">Tu emoción dominante y música personalizada</p>
          </div>

          <div className="action-buttons-group">
            <button
              className="action-button save-playlist"
              onClick={handleSavePlaylist}
              disabled={savingPlaylist || recommendations.length === 0}
              style={{
                background: spotifyConnected
                  ? emotionColors.gradient
                  : 'rgba(255, 255, 255, 0.1)',
                borderColor: emotionColors.glassBorder,
                opacity: savingPlaylist ? 0.6 : 1
              }}
            >
              {savingPlaylist ? (
                <>
                  <div className="button-spinner"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                  </svg>
                  {spotifyConnected ? 'Guardar Playlist' : 'Conectar Spotify'}
                </>
              )}
            </button>

            <button
              className="action-button new-analysis"
              onClick={() => navigate('/home/analyze')}
              style={{
                background: emotionColors.gradient,
                borderColor: emotionColors.glassBorder
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1 4 1 10 7 10"></polyline>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
              </svg>
              Nuevo Análisis
            </button>
          </div>
        </div>

        <div className="results-grid">
          {/* Sección Izquierda - Foto y Emociones */}
          <div className="photo-section">
            <GlassCard 
              variant="default" 
              className="photo-container"
              style={{
                background: emotionColors.glassBg,
                borderColor: emotionColors.glassBorder
              }}
            >
              <img src={photo} alt="Tu foto" className="result-photo" />
            </GlassCard>
            
            <GlassCard 
              variant="default" 
              className="emotion-card"
              style={{
                background: emotionColors.glassBg,
                borderColor: emotionColors.glassBorder
              }}
            >
              <div className="emotion-icon">{getEmotionEmoji(result.emotion)}</div>
              <div className="emotion-label">{getEmotionLabel(result.emotion)}</div>
              <div 
                className="confidence"
                style={{
                  background: emotionColors.gradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                {(result.confidence * 100).toFixed(1)}%
              </div>
              <div className="confidence-label">Confianza</div>
            </GlassCard>

            <GlassCard 
              variant="default" 
              className="emotions-breakdown-card"
              style={{
                background: emotionColors.glassBg,
                borderColor: emotionColors.glassBorder
              }}
            >
              <h3 className="section-subtitle">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                Desglose Emocional
              </h3>
              <div className="emotions-breakdown">
                {Object.entries(result.emotions_detected)
                  .sort(([, a], [, b]) => b - a)
                  .map(([emotion, value]) => {
                    const barColor = getEmotionColor(emotion);
                    return (
                      <div key={emotion} className="emotion-bar">
                        <span className="emotion-name">{getEmotionLabel(emotion)}</span>
                        <div className="progress-container">
                          <div 
                            className="progress-fill" 
                            style={{
                              width: `${value * 100}%`,
                              background: barColor.gradient
                            }} 
                          />
                        </div>
                        <span 
                          className="emotion-value"
                          style={{ color: barColor.secondary }}
                        >
                          {(value * 100).toFixed(1)}%
                        </span>
                      </div>
                    );
                  })}
              </div>
            </GlassCard>
          </div>

          {/* Sección Derecha - Música */}
          <div className="music-section">
            <GlassCard 
              variant="default" 
              className="music-container"
              style={{
                background: emotionColors.glassBg,
                borderColor: emotionColors.glassBorder
              }}
            >
              <div className="music-header">
                <h2 className="section-title">
                  🎵 Recomendaciones Musicales
                </h2>
                <p className="music-subtitle">
                  Canciones seleccionadas para tu estado de ánimo: <strong>{getEmotionLabel(result.emotion)}</strong>
                </p>
              </div>
              
              {loading ? (
                <div className="loading-state">
                  <div 
                    className="loading-spinner"
                    style={{ borderTopColor: emotionColors.primary }}
                  ></div>
                  <p>Cargando tus recomendaciones...</p>
                </div>
              ) : recommendations.length > 0 ? (
                <div className="tracks-list">
                  {recommendations.slice(0, 15).map((track, index) => (
                    <div 
                      key={index}
                      className="track-card"
                      onClick={() => window.open(track.external_urls?.spotify, '_blank')}
                    >
                      {track.album?.images?.[0]?.url ? (
                        <img 
                          src={track.album.images[0].url} 
                          alt={track.name}
                          className="album-cover"
                        />
                      ) : (
                        <div className="album-cover-placeholder">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 18V5l12-2v13"></path>
                            <circle cx="6" cy="18" r="3"></circle>
                            <circle cx="18" cy="16" r="3"></circle>
                          </svg>
                        </div>
                      )}
                      <div className="track-info">
                        <div className="track-name">{track.name}</div>
                        <div className="artist-name">
                          {track.artists?.map(a => a.name).join(', ') || 'Artista Desconocido'}
                        </div>
                      </div>
                      <div 
                        className="track-play-icon"
                        style={{ 
                          background: emotionColors.glassBg,
                          borderColor: emotionColors.glassBorder 
                        }}
                      >
                        <svg 
                          viewBox="0 0 24 24" 
                          fill="currentColor"
                          style={{ color: emotionColors.primary }}
                        >
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-music">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <p>No se pudieron cargar recomendaciones</p>
                  <button 
                    className="retry-button"
                    onClick={fetchRecommendations}
                    style={{
                      background: emotionColors.gradient,
                      borderColor: emotionColors.glassBorder
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="1 4 1 10 7 10"></polyline>
                      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                    </svg>
                    Reintentar
                  </button>
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;