
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ClientDashboard } from './pages/ClientDashboard';
import { DriverDashboard } from './pages/DriverDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
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
    // Check local storage for theme
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }

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
  
  // STRICT: Only 'admin.tripfers.com' is the Admin Portal
  // Localhost is treated as MAIN domain to allow testing all roles
  const isAdminDomain = hostname.startsWith('admin.'); 
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');

  console.log(`[App] Current Hostname: ${hostname} | Detected Mode: ${isAdminDomain ? 'ADMIN' : 'CLIENT'} | Localhost: ${isLocalhost}`);

  // Dynamic Favicon Switcher
  useEffect(() => {
    const updateFavicon = (url: string) => {
      if (!url) return;
      
      // Add timestamp to bust cache
      const cacheBustedUrl = `${url}${url.includes('?') ? '&' : '?'}v=${new Date().getTime()}`;
      
      // Remove existing icons to force browser update
      const selectors = [
        "link[rel*='icon']",
        "link[rel='shortcut icon']",
        "link[rel='apple-touch-icon']",
        "link[rel='mask-icon']"
      ];
      
      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(link => link.remove());
      });

      // Create new main favicon
      const linkIcon = document.createElement('link');
      linkIcon.rel = 'icon';
      linkIcon.type = url.endsWith('.svg') ? 'image/svg+xml' : 'image/png';
      linkIcon.href = cacheBustedUrl;
      document.head.appendChild(linkIcon);

      // Create apple touch icon
      const linkApple = document.createElement('link');
      linkApple.rel = 'apple-touch-icon';
      linkApple.href = cacheBustedUrl;
      document.head.appendChild(linkApple);

      // Log for debugging
      console.log(`Favicon updated to: ${url}`);
    };

    const applyBranding = async () => {
        let mainFavicon = '/favicon.png';
        let adminFavicon = '/favicon_admin.png';

        try {
            if (backend.getBrandingSettings) {
                const settings = await backend.getBrandingSettings();
                if (settings.mainFaviconUrl && settings.mainFaviconUrl.trim() !== '') {
                    mainFavicon = settings.mainFaviconUrl;
                }
                if (settings.adminFaviconUrl && settings.adminFaviconUrl.trim() !== '') {
                    adminFavicon = settings.adminFaviconUrl;
                }
            }
        } catch (e) {
            console.warn("Failed to load branding settings", e);
        }

        let useAdminBranding = isAdminDomain;

        // In development (localhost), toggle branding based on the active user role
        // This allows testing both favicons without changing domains
        if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
            useAdminBranding = user?.role === UserRole.ADMIN;
        }

        if (useAdminBranding) {
            updateFavicon(adminFavicon);
            document.title = 'Tripfers Admin Portal';
        } else {
            updateFavicon(mainFavicon);
            // Optional: Set a default title for the main site if needed
             if (document.title === 'Tripfers Admin Portal') document.title = 'Tripfers';
        }
    };

    applyBranding();
    
    // Subscribe to backend changes to update favicon in real-time
    const unsubscribe = backend.subscribe(applyBranding);
    return () => unsubscribe();
  }, [isAdminDomain, user]); // Added user dependency to update on role switch

  return (
    <Router>
      <Routes>
        {/* ------------------------------------------------------------
            ADMIN SUBDOMAIN ROUTING (admin.tripfers.com)
            ------------------------------------------------------------ */}
        {isAdminDomain ? (
           <>
              <Route path="/" element={
                  user?.role === UserRole.ADMIN ? (
                    <AdminDashboard />
                  ) : (
                    <Layout user={user} onLogout={handleLogout} toggleTheme={toggleTheme} isDark={isDark}>
                      <ClientDashboard user={null} onLogin={handleLogin} initialRole={UserRole.ADMIN} />
                    </Layout>
                  )
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
           </>
        ) : (
          /* ------------------------------------------------------------
             MAIN DOMAIN ROUTING (tripfers.com)
             ------------------------------------------------------------ */
           <>
              <Route path="/" element={
                  <Layout user={user} onLogout={handleLogout} toggleTheme={toggleTheme} isDark={isDark}>
                    {!user ? <ClientDashboard user={null} onLogin={handleLogin} /> : 
                    user.role === UserRole.DRIVER ? <Navigate to="/dashboard/driver" /> :
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

              {/* Redirect /admin to subdomain if accessed from main site, unless localhost */}
              <Route path="/admin" element={
                  isLocalhost ? (
                      user?.role === UserRole.ADMIN ? (
                        <AdminDashboard />
                      ) : (
                        <Layout user={user} onLogout={handleLogout} toggleTheme={toggleTheme} isDark={isDark}>
                          <ClientDashboard user={null} onLogin={handleLogin} initialRole={UserRole.ADMIN} />
                        </Layout>
                      )
                  ) : (
                      <NavigateExternal to="https://admin.tripfers.com" />
                  )
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
