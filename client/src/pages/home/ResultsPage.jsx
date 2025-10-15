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
      // Usar endpoint mockup directamente
      const url = `http://127.0.0.1:8000/recommend/mockup?emotion=${result.emotion}`;
      
      const response = await fetch(url);

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
          {/* Sección Izquierda - Foto y Emociones */}
          <div className="photo-section">
            <GlassCard variant="lilac" className="photo-container">
              <img src={photo} alt="Tu foto" className="result-photo" />
            </GlassCard>
            
            <GlassCard variant="pink" className="emotion-card">
              <div className="emotion-icon">{getEmotionEmoji(result.emotion)}</div>
              <div className="emotion-label">{getEmotionLabel(result.emotion)}</div>
              <div className="confidence">{Math.round(result.confidence * 100)}%</div>
              <div className="confidence-label">Confianza</div>
            </GlassCard>

            <GlassCard variant="salmon" className="emotions-breakdown-card">
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
            <GlassCard variant="blue" className="music-container">
              <div className="music-header">
                <h2 className="section-title">
                  🎵 Recomendaciones Musicales
                </h2>
                <p className="music-subtitle">
                  Canciones seleccionadas especialmente para tu estado de ánimo
                </p>
              </div>
              
              {loading ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
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
                      <div className="track-play-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-music">
                  <p>No se pudieron cargar recomendaciones</p>
                  <button 
                    className="action-button primary"
                    onClick={fetchRecommendations}
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

        <div className="results-actions">
          <button 
            className="action-button primary"
            onClick={() => navigate('/home/analyze')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1 4 1 10 7 10"></polyline>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
            </svg>
            Nuevo Análisis
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;