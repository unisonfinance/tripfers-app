
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ClientDashboard } from './pages/ClientDashboard';
import { DriverDashboard } from './pages/DriverDashboard';
import { AgencyDashboard } from './pages/AgencyDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { PartnerLogin } from './components/PartnerLogin';
import { MembershipSuccess } from './pages/MembershipSuccess';

import { User, UserRole, UserStatus } from './types';
import { backend } from './services/BackendService';
import './i18n'; // Initialize i18n

// Force refresh check


// Helper for external redirects
const NavigateExternal = ({ to }: { to: string }) => {
    useEffect(() => {
        window.location.href = to;
    }, [to]);
    return null;
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check local storage for theme - Default to LIGHT if not set
    try {
        if (localStorage.theme === 'dark') {
            setIsDark(true);
            document.documentElement.classList.add('dark');
        } else {
            // Default to Light
            setIsDark(false);
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    } catch (e) {
        // Fallback for private mode or errors
        setIsDark(false);
        document.documentElement.classList.remove('dark');
    }

    // FORCE ADMIN LOGIN REMOVED - Using Real Auth Flow
    const storedUser = backend.getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
      
      // Safety Cleanup: Ensure only one admin record exists if this is the admin
      if (storedUser.email === 'jclott77@gmail.com') {
          backend.ensureSingleAdmin('jclott77@gmail.com', storedUser.id);
      }
    } else {
      // DEV MODE ONLY: Auto-login for localhost testing if needed
      // Check if we are on production domains to avoid auto-login
      const hostname = window.location.hostname;
      if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
        // We will NOT auto-login as Admin to allow user to preview other roles easily
        // Uncomment the lines below if you want to force Admin login
        
        /* 
        // Attempt to login as Admin via Firebase to get a real token
        backend.login('jclott77@gmail.com', 'Corina77&&').then(async (user) => {
            setUser(user);
            // Immediate cleanup for duplicates
            await backend.ensureSingleAdmin('jclott77@gmail.com', user.id);
        }).catch(err => {
            console.error("Auto-login failed:", err);
            // Fallback: Create a fake admin user only if network login fails
            // This allows the UI to render but writes might fail if rules require auth
            const adminUser: User = {
                id: 'admin_master',
                name: 'Super Admin',
                email: 'jclott77@gmail.com',
                role: UserRole.ADMIN,
                status: UserStatus.ACTIVE,
                joinDate: new Date().toISOString()
            };
            setUser(adminUser);
            localStorage.setItem('tripfers_current_user', JSON.stringify(adminUser));
        });
        */
      }
    }

    // Load Google Maps script with API key from settings
    const loadGoogleMapsScript = async () => {
      try {
        // CLEANUP: Ensure legacy admin is removed
        await backend.deleteUserByEmail('admin@gmail.com');

        // FAST PATH: Check LocalStorage first to load INSTANTLY
        const cachedKey = localStorage.getItem('tripfers_google_maps_key');
        let apiKeyToUse = cachedKey;

        if (!apiKeyToUse) {
            // SLOW PATH: Must wait for Backend if first time
            const config = await backend.getIntegrations();
            if (config.googleMapsKey) {
                apiKeyToUse = config.googleMapsKey;
                localStorage.setItem('tripfers_google_maps_key', apiKeyToUse);
            }
        } else {
            // Background update: Check if key changed in DB, update for NEXT time
            backend.getIntegrations().then(config => {
                if (config.googleMapsKey && config.googleMapsKey !== cachedKey) {
                    localStorage.setItem('tripfers_google_maps_key', config.googleMapsKey);
                    console.log("Maps Key updated in background. Refresh to apply.");
                }
            });
        }
        
        // Prevent loading multiple scripts if one already exists
        if (apiKeyToUse && !window.google && !document.getElementById('google-maps-script')) {
          const script = document.createElement('script');
          script.id = 'google-maps-script'; // Unique ID to prevent duplicates
          // Added 'drawing' library
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKeyToUse}&libraries=places,drawing`;
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
    backend.logout(); // Clear session
    setUser(null);
    window.location.hash = '/';
    window.location.reload(); // Reload to clear the dev state if needed
  };

  // --- SUBDOMAIN ROUTING LOGIC ---
  const hostname = window.location.hostname;
  
  // STRICT: Routing based on subdomains
  const isAdminDomain = hostname.startsWith('admin.');
  const isPartnerDomain = hostname.startsWith('partners.'); 
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');

  console.log(`[App] Host: ${hostname} | Admin: ${isAdminDomain} | Partner: ${isPartnerDomain} | Local: ${isLocalhost}`);

  // Dynamic Favicon Switcher
  useEffect(() => {
    const updateFavicon = (url: string) => {
      if (!url) return;
      // Add timestamp to bust cache
      const cacheBustedUrl = `${url}${url.includes('?') ? '&' : '?'}v=${new Date().getTime()}`;
      
      const selectors = ["link[rel*='icon']", "link[rel='shortcut icon']", "link[rel='apple-touch-icon']", "link[rel='mask-icon']"];
      selectors.forEach(selector => document.querySelectorAll(selector).forEach(link => link.remove()));

      const linkIcon = document.createElement('link');
      linkIcon.rel = 'icon';
      linkIcon.type = url.endsWith('.svg') ? 'image/svg+xml' : 'image/png';
      linkIcon.href = cacheBustedUrl;
      document.head.appendChild(linkIcon);
    };

    const applyBranding = async () => {
        let mainFavicon = '/favicon.png';
        let adminFavicon = '/favicon_admin.png';
        let partnerFavicon = '/favicon.png'; // Default to main if not set

        try {
            if (backend.getBrandingSettings) {
                const settings = await backend.getBrandingSettings();
                if (settings.mainFaviconUrl?.trim()) mainFavicon = settings.mainFaviconUrl;
                if (settings.adminFaviconUrl?.trim()) adminFavicon = settings.adminFaviconUrl;
                if (settings.partnerFaviconUrl?.trim()) partnerFavicon = settings.partnerFaviconUrl;
            }
        } catch (e) { console.warn("Failed to load branding settings", e); }

        if (isAdminDomain || (isLocalhost && user?.role === UserRole.ADMIN)) {
            updateFavicon(adminFavicon);
            document.title = 'Tripfers Admin Portal';
        } else if (isPartnerDomain) {
            updateFavicon(partnerFavicon);
            document.title = 'Tripfers Partner Portal';
        } else {
            updateFavicon(mainFavicon);
            if (document.title === 'Tripfers Admin Portal' || document.title === 'Tripfers Partner Portal') document.title = 'Tripfers';
        }
    };
    applyBranding();
    const unsubscribe = backend.subscribe(applyBranding);
    return () => unsubscribe();
  }, [isAdminDomain, isPartnerDomain, user]);

  return (
    <Router>
      <Routes>
        {/* ------------------------------------------------------------
            ADMIN SUBDOMAIN (admin.tripfers.com)
            ------------------------------------------------------------ */}
        {isAdminDomain ? (
           <>
              <Route path="/" element={
                  user?.role === UserRole.ADMIN ? <AdminDashboard /> :
                  <Layout user={user} onLogout={handleLogout} toggleTheme={toggleTheme} isDark={isDark}>
                    <ClientDashboard user={null} onLogin={handleLogin} initialRole={UserRole.ADMIN} />
                  </Layout>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
           </>
        ) : isPartnerDomain ? (
        /* ------------------------------------------------------------
           PARTNER SUBDOMAIN (partners.tripfers.com)
           ------------------------------------------------------------ */
           <>
              <Route path="/" element={
                  user?.role === UserRole.AGENCY ? (
                    <Layout user={user} onLogout={handleLogout} toggleTheme={toggleTheme} isDark={isDark}>
                        <AgencyDashboard user={user} />
                    </Layout>
                  ) : (
                    <PartnerLogin onLogin={handleLogin} />
                  )
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
           </>
        ) : (
          /* ------------------------------------------------------------
             MAIN DOMAIN (tripfers.com)
             ------------------------------------------------------------ */
           <>
              <Route path="/" element={
                  user?.role === UserRole.ADMIN ? <AdminDashboard /> :
                  <Layout user={user} onLogout={handleLogout} toggleTheme={toggleTheme} isDark={isDark}>
                    {!user ? <ClientDashboard user={null} onLogin={handleLogin} /> : 
                    user.role === UserRole.DRIVER ? <Navigate to="/dashboard/driver" /> :
                    user.role === UserRole.AGENCY ? <Navigate to="/dashboard/agency" /> :
                    <ClientDashboard user={user} onLogin={handleLogin} />
                    }
                  </Layout>
              } />
              
              <Route path="/dashboard/client" element={
                  <Layout user={user} onLogout={handleLogout} toggleTheme={toggleTheme} isDark={isDark}>
                    <ClientDashboard user={user} onLogin={handleLogin} />
                  </Layout>
              } />
              
              <Route path="/dashboard/driver" element={
                  <Layout user={user} onLogout={handleLogout} toggleTheme={toggleTheme} isDark={isDark}>
                    {user?.role === UserRole.DRIVER ? <DriverDashboard key={user.id} user={user} /> : <Navigate to="/" />}
                  </Layout>
              } />

              <Route path="/dashboard/agency" element={
                  <Layout user={user} onLogout={handleLogout} toggleTheme={toggleTheme} isDark={isDark}>
                    {user?.role === UserRole.AGENCY ? <AgencyDashboard user={user} /> : <Navigate to="/" />}
                  </Layout>
              } />

              {/* Redirects to Subdomains (Production Only) */}
              <Route path="/admin" element={
                  isLocalhost ? (
                      user?.role === UserRole.ADMIN ? <AdminDashboard /> : 
                      <Layout user={user} onLogout={handleLogout} toggleTheme={toggleTheme} isDark={isDark}>
                          <ClientDashboard user={null} onLogin={handleLogin} initialRole={UserRole.ADMIN} />
                      </Layout>
                  ) : <NavigateExternal to="https://admin.tripfers.com" />
              } />
              
              <Route path="/partners" element={
                  isLocalhost ? (
                      user?.role === UserRole.AGENCY ? 
                      <Layout user={user} onLogout={handleLogout} toggleTheme={toggleTheme} isDark={isDark}>
                          <AgencyDashboard user={user} />
                      </Layout> : 
                      <PartnerLogin onLogin={handleLogin} />
                  ) : <NavigateExternal to="https://partners.tripfers.com" />
              } />

              <Route path="/membership-success" element={
                  <Layout user={user} onLogout={handleLogout} toggleTheme={toggleTheme} isDark={isDark}>
                    <MembershipSuccess user={user} />
                  </Layout>
              } />
           </>
        )}
      </Routes>
    </Router>
  );
}

export default App;
