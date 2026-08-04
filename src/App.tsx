/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { AdminLogin } from './pages/AdminLogin';
import { Dashboard } from './pages/Dashboard';
import { BookDetails } from './pages/BookDetails';
import { LibraryMap } from './pages/LibraryMap';
import { FacilitiesMap } from './pages/FacilitiesMap';
import { MyBooks } from './pages/MyBooks';
import { AdminDashboard } from './pages/AdminDashboard';
import { Search } from './pages/Search';
import { Landing } from './pages/Landing';
import { HelpCenter } from './pages/HelpCenter';
import { QRScanner } from './pages/QRScanner';
import { ARShowcase } from './pages/ARShowcase';
import { KnowledgeStars } from './pages/KnowledgeStars';
import { HiddenBridges } from './pages/HiddenBridges';
import { SmartLens } from './pages/SmartLens';
import { ResearchDNA } from './pages/ResearchDNA';
import { BookDuel } from './pages/BookDuel';
import { ReadingRoadmap } from './pages/ReadingRoadmap';
import { LibraryQuest } from './pages/LibraryQuest';
import { OmanCornerAR } from './pages/OmanCornerAR';
import { CognitiveARGame } from './pages/CognitiveARGame';
import { Profile } from './pages/Profile';
import { VirtualTour } from './pages/VirtualTour';
import { ShelfARScan } from './pages/ShelfARScan';
import { CompassAR } from './pages/CompassAR';
import { WebXRAR } from './pages/WebXRAR';
import { MOCK_USER } from './data/mockData';
import { User } from './types';
import { LanguageProvider, useLanguage } from './hooks/useLanguage';
import { incrementLoginCount } from './lib/utils';

// Lazy-loaded: pulls in mind-ar + tensorflow.js + three.js + AR.js, several
// multi-MB dependencies that should only load once a user actually opens the
// unified AR experience, not on every page visit.
const ArHub = lazy(() => import('./pages/ArHub').then((m) => ({ default: m.ArHub })));

// Read the stored user synchronously (not in a useEffect) so protected routes
// never see a false "not logged in" state on the very first render — that
// false state was enough for <Navigate> to redirect away before the real
// user loaded, breaking direct links/refreshes to any page but "/".
function loadStoredUser(): User | null {
  const storedUser = localStorage.getItem('library_user');
  if (!storedUser) return null;
  try {
    const parsedUser = JSON.parse(storedUser);
    // Migration for name change in demo
    if (parsedUser.name === 'بدر الرئيسي') {
      parsedUser.name = 'فاطمة المعمري';
      localStorage.setItem('library_user', JSON.stringify(parsedUser));
    }
    return parsedUser;
  } catch {
    return null;
  }
}

function AppContent() {
  const [user, setUser] = useState<User | null>(loadStoredUser);
  const { dir } = useLanguage();

  // The stored user is a snapshot taken at login. Without this it never
  // changes, so a renamed account keeps showing its old name — and a session
  // revoked on the server still looks signed in. Re-read the account on load
  // and adopt whatever the server says.
  useEffect(() => {
    let token: string | null = null;
    try { token = sessionStorage.getItem('library_token'); } catch { /* private mode */ }
    if (!token) return;
    let cancelled = false;
    fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (cancelled || !data?.user) return;
        setUser(data.user);
        localStorage.setItem('library_user', JSON.stringify(data.user));
      })
      .catch(() => { /* offline: keep the stored copy */ });
    return () => { cancelled = true; };
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('library_user', JSON.stringify(userData));
    incrementLoginCount();
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('library_user');
    // Invalidate the session server-side too, so the token cannot be replayed.
    try {
      const token = sessionStorage.getItem('library_token');
      if (token) {
        fetch('/api/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
          .catch(() => { /* best effort — the local session is gone either way */ });
      }
      sessionStorage.removeItem('library_token');
    } catch { /* private mode */ }
  };

  const handleUpdateUser = (updater: (current: User) => User) => {
    setUser((current) => {
      if (!current) return current;
      const updated = updater(current);
      localStorage.setItem('library_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div dir={dir} className="min-h-screen bg-[#F5F7FA] font-sans transition-all duration-500">
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} 
        />
        {/* Staff entrance. Deliberately not linked from anywhere in the app. */}
        <Route
          path="/admin-login"
          element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace /> : <AdminLogin onLogin={handleLogin} />}
        />
        <Route 
          path="/" 
          element={
            user ? (
              user.role === 'admin' ? (
                <Navigate to="/admin" replace />
              ) : (
                <Layout user={user} onLogout={handleLogout}>
                  <Dashboard user={user} />
                </Layout>
              )
            ) : (
              <Landing />
            )
          } 
        />
        <Route
          path="/book/:id"
          element={user ? <Layout user={user} onLogout={handleLogout}><BookDetails user={user} onUpdateUser={handleUpdateUser} /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/map"
          element={user ? <Layout user={user} onLogout={handleLogout}><LibraryMap /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/facilities"
          element={user ? <Layout user={user} onLogout={handleLogout}><FacilitiesMap /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/ar"
          element={
            user ? (
              <Suspense fallback={<div className="fixed inset-0 z-50 bg-black" />}>
                <ArHub />
              </Suspense>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/my-books"
          element={user ? <Layout user={user} onLogout={handleLogout}><MyBooks user={user} /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/profile"
          element={user ? <Layout user={user} onLogout={handleLogout}><Profile user={user} /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/admin"
          // Signed out on /admin means someone is heading for the panel, so
          // send them to the staff door rather than the student one.
          element={user ? (user.role === 'admin' ? <Layout user={user} onLogout={handleLogout}><AdminDashboard /></Layout> : <Navigate to="/" replace />) : <Navigate to="/admin-login" replace />}
        />
        <Route
          path="/search"
          element={user ? <Layout user={user} onLogout={handleLogout}><Search /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/help"
          element={user ? <Layout user={user} onLogout={handleLogout}><HelpCenter user={user} /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/ar-showcase"
          element={user ? <Layout user={user} onLogout={handleLogout}><ARShowcase /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/scan"
          element={user ? <QRScanner /> : <Navigate to="/login" />}
        />
        <Route
          path="/shelf-scan"
          element={user ? <ShelfARScan /> : <Navigate to="/login" />}
        />
        <Route
          path="/compass"
          element={user ? <CompassAR /> : <Navigate to="/login" />}
        />
        <Route
          path="/webxr"
          element={user ? <WebXRAR /> : <Navigate to="/login" />}
        />
        <Route
          path="/knowledge-stars"
          element={user ? <KnowledgeStars /> : <Navigate to="/login" />}
        />
        <Route
          path="/hidden-bridges"
          element={user ? <HiddenBridges /> : <Navigate to="/login" />}
        />
        <Route
          path="/smart-lens"
          element={user ? <SmartLens /> : <Navigate to="/login" />}
        />
        <Route
          path="/research-dna"
          element={user ? <Layout user={user} onLogout={handleLogout}><ResearchDNA /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/book-duel"
          element={user ? <Layout user={user} onLogout={handleLogout}><BookDuel /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/reading-roadmap"
          element={user ? <Layout user={user} onLogout={handleLogout}><ReadingRoadmap /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/library-quest"
          element={user ? <Layout user={user} onLogout={handleLogout}><LibraryQuest /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/oman-corner"
          element={user ? <Layout user={user} onLogout={handleLogout}><OmanCornerAR /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/cognitive-ar"
          element={user ? <Layout user={user} onLogout={handleLogout}><CognitiveARGame /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/tour"
          element={user ? <VirtualTour /> : <Navigate to="/login" />}
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </BrowserRouter>
  );
}
