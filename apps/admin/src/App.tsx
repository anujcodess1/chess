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

export function App() {
  const session = useSession();

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/login" element={<AuthPage />} />

      <Route element={<PlayerLayout />}>
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
