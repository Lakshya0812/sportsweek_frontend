/**
 * Axios instance pre-configured for the Django backend.
 * Automatically attaches the JWT access token and handles 401 refresh logic.
 */
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — attach access token ─────────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor — handle 401 / token refresh ────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (
      error.response?.status === 401 &&
      !original._retry &&
      localStorage.getItem('refresh_token')
    ) {
      original._retry = true;
      try {
        const { data } = await axios.post(`${BASE_URL}/api/auth/refresh/`, {
          refresh: localStorage.getItem('refresh_token'),
        });
        localStorage.setItem('access_token', data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return apiClient(original);
      } catch {
        // Refresh failed — clear tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/admin/login';
      }
    }

    return Promise.reject(error);
  }
);

// ── API helpers ───────────────────────────────────────────────────────────

export const api = {
  // Auth
  login: (credentials) => apiClient.post('/auth/login/', credentials),

  // Galaxies
  getGalaxies: (params) => apiClient.get('/galaxies/', { params }),
  getGalaxy: (id) => apiClient.get(`/galaxies/${id}/`),
  createGalaxy: (data) => {
    const form = new FormData();
    Object.entries(data).forEach(([k, v]) => v != null && form.append(k, v));
    return apiClient.post('/galaxies/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  updateGalaxy: (id, data) => {
    const form = new FormData();
    Object.entries(data).forEach(([k, v]) => v != null && form.append(k, v));
    return apiClient.patch(`/galaxies/${id}/`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteGalaxy: (id) => apiClient.delete(`/galaxies/${id}/`),

  // Sports
  getSports: (params) => apiClient.get('/sports/', { params }),
  getSport: (id) => apiClient.get(`/sports/${id}/`),
  createSport: (data) => apiClient.post('/sports/', data),
  updateSport: (id, data) => apiClient.patch(`/sports/${id}/`, data),
  deleteSport: (id) => apiClient.delete(`/sports/${id}/`),

  // Matches
  getMatches: (params) => apiClient.get('/matches/', { params }),
  getMatch: (id) => apiClient.get(`/matches/${id}/`),
  createMatch: (data) => apiClient.post('/matches/', data),
  updateMatchResult: (id, data) => apiClient.patch(`/matches/${id}/`, data),
  deleteMatch: (id) => apiClient.delete(`/matches/${id}/`),

  // Players
  getPlayers: (params) => apiClient.get('/players/', { params }),
  createPlayer: (data) => apiClient.post('/players/', data),
  updatePlayer: (id, data) => apiClient.patch(`/players/${id}/`, data),
  deletePlayer: (id) => apiClient.delete(`/players/${id}/`),

  // Sub-matches
  getSubMatches: (params) => apiClient.get('/sub-matches/', { params }),
  createSubMatch: (data) => apiClient.post('/sub-matches/', data),
  updateSubMatch: (id, data) => apiClient.patch(`/sub-matches/${id}/`, data),
  deleteSubMatch: (id) => apiClient.delete(`/sub-matches/${id}/`),

  // Sub-match team players
  getSubMatchTeamPlayers: (params) => apiClient.get('/sub-match-team-players/', { params }),
  createSubMatchTeamPlayer: (data) => apiClient.post('/sub-match-team-players/', data),
  deleteSubMatchTeamPlayer: (id) => apiClient.delete(`/sub-match-team-players/${id}/`),

  // Dashboard
  getDashboard: () => apiClient.get('/dashboard/'),
};
