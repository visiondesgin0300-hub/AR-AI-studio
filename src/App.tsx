/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { BookDetails } from './pages/BookDetails';
import { LibraryMap } from './pages/LibraryMap';
import { FacilitiesMap } from './pages/FacilitiesMap';
import { MyBooks } from './pages/MyBooks';
import { AdminDashboard } from './pages/AdminDashboard';
import { Search } from './pages/Search';
import { Landing } from './pages/Landing';
import { HelpCenter } from './pages/HelpCenter';
import { ArLab } from './pages/ArLab';
import { MOCK_USER } from './data/mockData';
import { User } from './types';
import { LanguageProvider, useLanguage } from './hooks/useLanguage';

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

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('library_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('library_user');
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
          path="/landing" 
          element={<Landing />} 
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
          path="/admin" 
          element={user ? <Layout user={user} onLogout={handleLogout}><AdminDashboard /></Layout> : <Navigate to="/login" />} 
        />
        <Route
          path="/search"
          element={user ? <Layout user={user} onLogout={handleLogout}><Search /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/help"
          element={user ? <Layout user={user} onLogout={handleLogout}><HelpCenter /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/ar-lab"
          element={user ? <Layout user={user} onLogout={handleLogout}><ArLab /></Layout> : <Navigate to="/login" />}
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
