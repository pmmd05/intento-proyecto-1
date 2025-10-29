DROP TABLE IF EXISTS usuario CASCADE;
DROP TABLE IF EXISTS password_recovery CASCADE;
DROP TABLE IF EXISTS playlist CASCADE;
DROP TABLE IF EXISTS analisis CASCADE;
DROP TABLE IF EXISTS sesion CASCADE;

CREATE TABLE usuario (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sesion(
    id SERIAL PRIMARY KEY,
    ID_usuario INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    Fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Fecha_fin TIMESTAMP
);

-- Tabla para almacenar análisis emocionales
CREATE TABLE analisis (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    emotion VARCHAR(50) NOT NULL,
    confidence DECIMAL(5,4) NOT NULL,
    emotions_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_confidence CHECK (confidence >= 0 AND confidence <= 1)
);

-- Tabla para almacenar playlists creadas
CREATE TABLE playlist (
    id SERIAL PRIMARY KEY,
    analisis_id INTEGER NOT NULL REFERENCES analisis(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    emotion VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    spotify_id VARCHAR(100),
    spotify_url TEXT,
    track_count INTEGER DEFAULT 0,
    saved_to_spotify BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para códigos de recuperación de contraseña
CREATE TABLE password_recovery (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    code VARCHAR(6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES usuario(id)
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_recovery_code ON password_recovery(code, user_id, is_used);
CREATE INDEX idx_recovery_expires ON password_recovery(expires_at);
CREATE INDEX idx_analisis_user ON analisis(user_id, created_at DESC);
CREATE INDEX idx_analisis_emotion ON analisis(emotion);
CREATE INDEX idx_playlist_user ON playlist(user_id, created_at DESC);
CREATE INDEX idx_playlist_analisis ON playlist(analisis_id);