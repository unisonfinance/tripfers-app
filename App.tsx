
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ClientDashboard } from './pages/ClientDashboard';
import { DriverDashboard } from './pages/DriverDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { MembershipSuccess } from './pages/MembershipSuccess';
import { DevRoleSwitcher } from './components/DevRoleSwitcher';
import { User, UserRole, UserStatus } from './types';
import { mockBackend } from './services/mockBackend';
import './i18n'; // Initialize i18n

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check local storage for theme
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }

    const storedUser = mockBackend.getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
    } else {
      // DEV MODE ONLY: Auto-login for localhost testing if needed
      // Check if we are on production domains to avoid auto-login
      const hostname = window.location.hostname;
      if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
           // Default to Gold Coast driver if no session exists for dev purposes
          mockBackend.getUser('6').then(defaultUser => {
            if (defaultUser) {
              setUser(defaultUser);
              localStorage.setItem('gettransfer_current_user', JSON.stringify(defaultUser));
            }
          });
      }
    }

    // Load Google Maps script with API key from settings
    const loadGoogleMapsScript = async () => {
      try {
        const config = await mockBackend.getIntegrations();
        
        // Prevent loading multiple scripts if one already exists
        if (config.googleMapsKey && !window.google && !document.getElementById('google-maps-script')) {
          const script = document.createElement('script');
          script.id = 'google-maps-script'; // Unique ID to prevent duplicates
          // Added 'drawing' library
          script.src = `https://maps.googleapis.com/maps/api/js?key=${config.googleMapsKey}&libraries=places,drawing`;
          script.async = true;
          script.defer = true;
          
          script.onerror = () => {
            console.error("Google Maps script failed to load. Check API Key restrictions.");
          };

          document.head.appendChild(script);
        }
      } catch (error) {
        console.error("Failed to load Google Maps configuration:", error);
      }
    };
    
    loadGoogleMapsScript();
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setIsDark(true);
    }
  };

  const handleLogin = (newUser: User) => {
    // Update state directly to avoid reload loop
    setUser(newUser);
  };

  const handleLogout = () => {
    mockBackend.logout(); // Clear session
    setUser(null);
    window.location.hash = '/';
    window.location.reload(); // Reload to clear the dev state if needed
  };

  // --- DEV TOOL HANDLER ---
  const handleDevSwitch = async (userId: string) => {
    const targetUser = await mockBackend.getUser(userId);

    if (targetUser) {
        setUser(targetUser);
        // Persist to local storage so it survives refresh in dev mode
        localStorage.setItem('gettransfer_current_user', JSON.stringify(targetUser));
    }
  };

  // --- SUBDOMAIN ROUTING LOGIC ---
  const hostname = window.location.hostname;
  const isAdminDomain = hostname.startsWith('admin.');

  return (
    <Router>
      {/* Dev Switcher Overlay - Only show on localhost or dev */}
      {(hostname.includes('localhost') || hostname.includes('dev')) && (
          <DevRoleSwitcher currentUser={user} onSwitch={handleDevSwitch} />
      )}
      
      <Layout user={user} onLogout={handleLogout} toggleTheme={toggleTheme} isDark={isDark}>
        <Routes>
          {/* ------------------------------------------------------------
              ADMIN SUBDOMAIN ROUTING (admin.tripfers.com)
              ------------------------------------------------------------ */}
          {isAdminDomain ? (
             <>
                <Route path="/" element={
                    user?.role === UserRole.ADMIN ? <AdminDashboard /> : <ClientDashboard user={null} onLogin={handleLogin} initialRole={UserRole.ADMIN} /> 
                } />
                <Route path="*" element={<Navigate to="/" replace />} />
             </>
          ) : (
            /* ------------------------------------------------------------
               MAIN DOMAIN ROUTING (tripfers.com)
               ------------------------------------------------------------ */
             <>
                <Route path="/" element={
                    !user ? <ClientDashboard user={null} onLogin={handleLogin} /> : 
                    user.role === UserRole.DRIVER ? <Navigate to="/dashboard/driver" /> :
                    <ClientDashboard user={user} onLogin={handleLogin} />
                } />
                
                <Route path="/dashboard/client" element={
                    <ClientDashboard user={user} onLogin={handleLogin} />
                } />
                
                <Route path="/dashboard/driver" element={
                    user?.role === UserRole.DRIVER ? <DriverDashboard key={user.id} user={user} /> : <Navigate to="/" />
                } />

                {/* Redirect /admin to subdomain if accessed from main site */}
                <Route path="/admin" element={() => {
                    window.location.href = 'https://admin.tripfers.com';
                    return null;
                }} />

                <Route path="/membership-success" element={<MembershipSuccess user={user} />} />
             </>
          )}

        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
