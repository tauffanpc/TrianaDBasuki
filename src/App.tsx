import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './lib/LanguageContext';
import Intro from './pages/Intro';
import Landing from './pages/Landing';
import Archive from './pages/Archive';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import DiaryHistory from './pages/DiaryHistory';

export default function App() {
  return (
    <LanguageProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Intro />} />
          <Route path="/home" element={<Landing />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/diary-history" element={<DiaryHistory />} />
        </Routes>
      </Router>
    </LanguageProvider>
  );
}
