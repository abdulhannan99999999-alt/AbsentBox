import React, { useEffect } from 'react';
import { useMsal } from "@azure/msal-react";
import { useApp } from './store/AppContext';
import { fetchUserProfile, fetchUserPhoto } from './api/graph';
import Welcome from './components/auth/Welcome';
import Dashboard from './components/dashboard/Dashboard';
import Onboarding from './components/onboarding/Onboarding';
import Settings from './components/settings/Settings';
import Billing from './components/billing/Billing';

export default function App() {
  const { accounts } = useMsal();
  const { view, setView, setUserProfile, settings, setIsAuthenticated, onboarding } = useApp();

  // Already signed in with Microsoft? Skip the auth screens on relaunch.
  useEffect(() => {
    if (accounts && accounts.length > 0 && view.startsWith('auth-')) {
      setView(onboarding.completed ? 'dash-welcome' : 'onboard-profile');
    }
  }, [accounts]);

  // Sync MSAL login state — fetch REAL profile from Graph API
  useEffect(() => {
    if (accounts && accounts.length > 0) {
      const account = accounts[0];
      setIsAuthenticated(true);

      // Immediately set basic info from MSAL token
      setUserProfile(prev => ({
        ...prev,
        name: account.name?.split(' ')[0] || prev.name,
        surname: account.name?.split(' ').slice(1).join(' ') || prev.surname,
        email: account.username || prev.email,
      }));

      // Then fetch full profile from Graph API
      (async () => {
        try {
          const profile = await fetchUserProfile();
          setUserProfile(prev => ({
            ...prev,
            name: profile.givenName || prev.name,
            surname: profile.surname || prev.surname,
            email: profile.mail || prev.email,
            jobTitle: profile.jobTitle || prev.jobTitle,
            company: profile.companyName || prev.company,
            phone: (profile.businessPhones && profile.businessPhones[0]) || prev.phone,
            mobile: profile.mobilePhone || prev.mobile,
          }));
          console.log('✅ Real profile loaded from Microsoft Graph');
        } catch (err) {
          console.warn('Could not fetch Graph profile, using MSAL token data:', err);
        }

        // Fetch profile photo
        try {
          const photoUrl = await fetchUserPhoto();
          if (photoUrl) {
            setUserProfile(prev => ({ ...prev, avatar: photoUrl }));
            console.log('✅ Profile photo loaded from Microsoft Graph');
          }
        } catch (err) {
          console.warn('Could not fetch profile photo:', err);
        }
      })();
    }
  }, [accounts]);

  return (
    <div
      id="app-root"
      className={`min-h-screen overflow-x-hidden font-sans transition-colors duration-200 ${
        settings.darkMode
          ? 'bg-slate-900 text-white'
          : 'bg-slate-100 text-slate-800'
      }`}
    >
      {/* AUTH FLOW */}
      {view.startsWith('auth-') && <Welcome />}

      {/* ONBOARDING FLOW */}
      {view.startsWith('onboard-') && <Onboarding />}

      {/* DASHBOARD FLOW */}
      {view.startsWith('dash-') && <Dashboard />}

      {/* SETTINGS FLOW */}
      {view.startsWith('settings-') && <Settings />}

      {/* BILLING FLOW */}
      {view.startsWith('bill-') && <Billing />}
    </div>
  );
}

