import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { AuthPage } from './pages/AuthPage';
import { HomePage } from './pages/HomePage';
import { PlayPage } from './pages/PlayPage';
import { PuzzlesPage } from './pages/PuzzlesPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { useSession } from './auth';

function PlayerLayout() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000000', color: '#ffffff', fontFamily: "'Poppins', sans-serif" }}>
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
}

function RequireAuth() {
  const session = useSession();
  if (!session) return <Navigate to="/auth" replace />;
  return <PlayerLayout />;
}

function AuthPageRoute() {
  const session = useSession();
  if (session) return <Navigate to="/" replace />;
  return <AuthPage />;
}

export function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPageRoute />} />
      <Route path="/login" element={<AuthPageRoute />} />

      <Route element={<RequireAuth />}>
        <Route index element={<HomePage />} />
        <Route path="/play" element={<PlayPage />} />
        <Route path="/puzzles" element={<PuzzlesPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
