/**
 * Módulo para gestionar el almacenamiento del token
 * Usa sessionStorage para que la sesión expire al cerrar el navegador
 */

const TOKEN_KEY = 'access_token';

export const TokenStorage = {
  /**
   * Guarda el token (se borra al cerrar el navegador)
   */
  setToken(token) {
    sessionStorage.setItem(TOKEN_KEY, token);
  },

  /**
   * Obtiene el token
   */
  getToken() {
    return sessionStorage.getItem(TOKEN_KEY);
  },

  /**
   * Elimina el token
   */
  removeToken() {
    sessionStorage.removeItem(TOKEN_KEY);
    // Limpiar también de localStorage por si hay tokens viejos
    localStorage.removeItem(TOKEN_KEY);
  },

  /**
   * Verifica si existe un token
   */
  hasToken() {
    return !!sessionStorage.getItem(TOKEN_KEY);
  },

  /**
   * Verifica si el token ha expirado
   * @returns {boolean} true si el token ha expirado o no existe
   */
  isTokenExpired() {
    const token = this.getToken();
    if (!token) return true;

    try {
      // Decodificar el payload del JWT (sin verificar firma)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // exp viene en segundos
      return Date.now() >= expirationTime;
    } catch (error) {
      console.error('Error verificando expiración del token:', error);
      return true; // Si hay error, considerar expirado
    }
  }
};