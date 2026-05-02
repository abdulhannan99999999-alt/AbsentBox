import React, { useState } from 'react';
// Core Flow Components
import Welcome from './components/auth/Welcome';
import Dashboard from './components/dashboard/Dashboard';
import Onboarding from './components/onboarding/Onboarding';
import Settings from './components/settings/Settings';
import Billing from './components/billing/Billing';

export default function App() {
  // Master Router State
  const [view, setView] = useState('auth-welcome');

  return (
    <div className="app-container overflow-hidden">
      {/* AUTH FLOW */}
      {view.startsWith('auth-') && <AuthRouter view={view} setView={setView} />}

      {/* ONBOARDING FLOW */}
      {view.startsWith('onboard-') && <OnboardingRouter view={view} setView={setView} />}

      {/* DASHBOARD FLOW */}
      {view.startsWith('dash-') && <DashboardRouter view={view} setView={setView} />}

      {/* SETTINGS FLOW */}
      {view.startsWith('settings-') && <SettingsRouter view={view} setView={setView} />}

      {/* BILLING FLOW */}
      {view.startsWith('bill-') && <BillingRouter view={view} setView={setView} />}
    </div>
  );
}

// Sub-routers for organizational clarity
function AuthRouter({ view, setView }) { /* Logic for 7 auth pages */ return <Welcome onNext={() => setView('dash-main')} /> }
function OnboardingRouter({ view, setView }) { /* Logic for 8 onboarding pages */ return <div /> }
function DashboardRouter({ view, setView }) { /* Logic for 10 dashboard pages */ return <Dashboard onNavigate={setView} /> }
function SettingsRouter({ view, setView }) { /* Logic for 6 settings pages */ return <div /> }
function BillingRouter({ view, setView }) { /* Logic for 8 billing pages */ return <Billing onBack={() => setView('dash-main')} /> }
