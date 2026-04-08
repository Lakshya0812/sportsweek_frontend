/**
 * Root application component — sets up routing and auth context.
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Public pages
import Leaderboard from './pages/Leaderboard.jsx';
import Matches from './pages/Matches.jsx';

// Admin pages
import Login from './pages/admin/Login.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import GalaxiesAdmin from './pages/admin/GalaxiesAdmin.jsx';
import PlayersAdmin from './pages/admin/PlayersAdmin.jsx';
import SportsAdmin from './pages/admin/SportsAdmin.jsx';
import MatchesAdmin from './pages/admin/MatchesAdmin.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Public routes — wrapped in shared layout ── */}
          <Route
            path="/"
            element={
              <Layout>
                <Leaderboard />
              </Layout>
            }
          />
          <Route
            path="/matches"
            element={
              <Layout>
                <Matches />
              </Layout>
            }
          />

          {/* ── Auth ── */}
          <Route path="/admin/login" element={<Login />} />

          {/* ── Protected admin routes ── */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/galaxies"
            element={
              <ProtectedRoute>
                <Layout>
                  <GalaxiesAdmin />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/players"
            element={
              <ProtectedRoute>
                <Layout>
                  <PlayersAdmin />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sports"
            element={
              <ProtectedRoute>
                <Layout>
                  <SportsAdmin />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/matches"
            element={
              <ProtectedRoute>
                <Layout>
                  <MatchesAdmin />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
