import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../../components/sidebar/Sidebar';
import GlassCard from '../../components/layout/GlassCard';
import './ResultsPage.css';

const ResultsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  
  const { result, photo } = location.state || {};

  useEffect(() => {
    if (!result || !photo) {
      navigate('/home/analyze');
      return;
    }

    fetchRecommendations();
  }, [result]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const spotifyToken = localStorage.getItem('spotify_token');
      
      if (!spotifyToken) {
        console.log('No hay token de Spotify');
        setLoading(false);
        return;
      }

      const response = await fetch(
        `http://127.0.0.1:8000/recommend?emotion=${result.emotion}`,
        {
          headers: {
            'Authorization': `Bearer ${spotifyToken}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.tracks || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="results-page gradient-bg">
      <Sidebar />
      
      <div className="results-content">
        <div className="results-header">
          <h1 className="results-title">Resultados del Análisis</h1>
        </div>

        <div className="results-grid">
          {/* Sección Izquierda */}
          <div className="photo-section">
            <GlassCard variant="lilac">
              <img src={photo} alt="Tu foto" className="result-photo" />
            </GlassCard>
            
            <GlassCard variant="pink" className="emotion-card">
              <div className="emotion-icon">{getEmotionEmoji(result.emotion)}</div>
              <div className="emotion-label">{getEmotionLabel(result.emotion)}</div>
              <div className="confidence">{Math.round(result.confidence * 100)}%</div>
              <div className="confidence-label">Confianza</div>
            </GlassCard>

            <GlassCard variant="salmon">
              <h3 className="section-subtitle">Todas las emociones</h3>
              <div className="emotions-breakdown">
                {Object.entries(result.emotions_detected)
                  .sort(([, a], [, b]) => b - a)
                  .map(([emotion, value]) => (
                    <div key={emotion} className="emotion-bar">
                      <span className="emotion-name">{getEmotionLabel(emotion)}</span>
                      <div className="progress-container">
                        <div className="progress-fill" style={{width: `${value * 100}%`}} />
                      </div>
                      <span className="emotion-value">{Math.round(value * 100)}%</span>
                    </div>
                  ))}
              </div>
            </GlassCard>
          </div>

          {/* Sección Derecha - Música */}
          <div className="music-section">
            <GlassCard variant="blue">
              <h2 className="section-title">🎵 Recomendaciones Musicales</h2>
              
              {loading ? (
                <div className="loading-state">Cargando recomendaciones...</div>
              ) : recommendations.length > 0 ? (
                <div className="tracks-list">
                  {recommendations.slice(0, 15).map((track, index) => (
                    <div 
                      key={index}
                      className="track-card glass"
                      onClick={() => window.open(track.external_urls?.spotify, '_blank')}
                    >
                      {track.album?.images?.[0]?.url && (
                        <img 
                          src={track.album.images[0].url} 
                          alt={track.name}
                          className="album-cover"
                        />
                      )}
                      <div className="track-info">
                        <div className="track-name">{track.name}</div>
                        <div className="artist-name">
                          {track.artists?.map(a => a.name).join(', ')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-music">
                  <p>Conecta tu cuenta de Spotify para obtener recomendaciones</p>
                </div>
              )}
            </GlassCard>
          </div>
        </div>

        <div className="results-actions">
          <button 
            className="glass-button primary"
            onClick={() => navigate('/home/analyze')}
          >
            🔄 Nuevo Análisis
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;