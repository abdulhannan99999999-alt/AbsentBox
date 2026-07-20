import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { t as translate, Locale } from '../i18n/translations';
import { CustomCategory } from '../api/categorize';

// ── Types ──
export interface UserProfile {
  name: string;
  surname: string;
  email: string;
  jobTitle: string;
  company: string;
  phone: string;
  mobile: string;
  avatar?: string;
}

export interface AbsenceSettings {
  beforeAbsenceStart: string;
  beforeAbsenceEnd: string;
  afterAbsenceStart: string;
  afterAbsenceEnd: string;
  autoPopup: boolean;
  processFromServer: boolean;
}

export interface CategoryState {
  enabled: boolean;
  order: number;
}

export interface CategorySettings {
  highPriority: CategoryState;
  customer: CategoryState;
  supervisor: CategoryState;
  supplier: CategoryState;
  inCC: CategoryState;
  meetings: CategoryState;
  uncategorized: CategoryState;
  newsletter: CategoryState;
  spam: CategoryState;
  complaints: CategoryState;
  proxy: CategoryState;
  tasksForMe: CategoryState;
  custom: CustomCategory[];
}

export interface ContactRules {
  supervisors: string;
  customers: string;
  suppliers: string;
  proxy: string;
}

export interface AppSettings {
  language: 'de' | 'en' | 'fr' | 'es';
  darkMode: boolean;
  summaryEnabled: boolean;
  tasksEnabled: boolean;
  clusteringEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export interface OnboardingData {
  completed: boolean;
  currentStep: number;
  profile: UserProfile;
  absence: AbsenceSettings;
  categories: CategorySettings;
  contacts: ContactRules;
}

// ── Default Values ──
const defaultProfile: UserProfile = {
  name: 'Mario',
  surname: 'Klaric',
  email: 'mario@absentbox.de',
  jobTitle: 'Chief Product Officer',
  company: 'Absentbox Corp',
  phone: '+49 123 456789',
  mobile: '+49 176 987654',
};

const defaultSettings: AppSettings = {
  language: 'en',
  darkMode: false,
  summaryEnabled: true,
  tasksEnabled: true,
  clusteringEnabled: false,
  emailNotifications: true,
  pushNotifications: false,
};

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

const defaultAbsence: AbsenceSettings = {
  beforeAbsenceStart: isoDaysAgo(14),
  beforeAbsenceEnd: isoDaysAgo(0),
  afterAbsenceStart: '',
  afterAbsenceEnd: '',
  autoPopup: true,
  processFromServer: true,
};

const defaultCategories: CategorySettings = {
  highPriority: { enabled: true, order: 1 },
  customer: { enabled: true, order: 2 },
  supervisor: { enabled: false, order: 0 },
  supplier: { enabled: false, order: 0 },
  inCC: { enabled: false, order: 0 },
  meetings: { enabled: false, order: 0 },
  uncategorized: { enabled: false, order: 0 },
  newsletter: { enabled: true, order: 3 },
  spam: { enabled: false, order: 0 },
  complaints: { enabled: false, order: 0 },
  proxy: { enabled: false, order: 0 },
  tasksForMe: { enabled: false, order: 0 },
  custom: [],
};

const defaultContacts: ContactRules = {
  supervisors: '',
  customers: '',
  suppliers: '',
  proxy: '',
};

// ── LocalStorage Persistence ──
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(`absentbox_${key}`);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.warn(`Failed to load ${key} from localStorage`, e);
  }
  return fallback;
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`absentbox_${key}`, JSON.stringify(value));
  } catch (e) {
    console.warn(`Failed to save ${key} to localStorage`, e);
  }
}

// ── Context Types ──
interface AppContextType {
  // View/Navigation
  view: string;
  setView: (v: string) => void;
  viewHistory: string[];
  goBack: () => void;

  // User Profile
  userProfile: UserProfile;
  setUserProfile: (p: UserProfile | ((prev: UserProfile) => UserProfile)) => void;

  // App Settings
  settings: AppSettings;
  setSettings: (s: AppSettings | ((prev: AppSettings) => AppSettings)) => void;

  // i18n
  t: (key: string) => string;

  // Onboarding
  onboarding: OnboardingData;
  setOnboarding: (o: OnboardingData | ((prev: OnboardingData) => OnboardingData)) => void;

  // Absence helpers
  getAbsenceWindow: () => { start: string; end: string };

  // Manual category overrides (move between categories)
  manualCategories: Record<string, string>;
  setManualCategory: (emailId: string, category: string) => void;

  // Trial
  trialDaysRemaining: number;
  currentPlan: 'trial' | 'free' | 'premium';
  setCurrentPlan: (p: 'trial' | 'free' | 'premium') => void;

  // Toast
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  triggerToast: (message: string, type?: 'success' | 'error' | 'info') => void;

  // Auth
  isAuthenticated: boolean;
  setIsAuthenticated: (v: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const TRIAL_DAYS = 14;

// ── Provider ──
export function AppProvider({ children }: { children: ReactNode }) {
  const [view, setViewRaw] = useState(() => loadFromStorage('view', 'auth-welcome'));
  const [viewHistory, setViewHistory] = useState<string[]>([]);
  const [userProfile, setUserProfileRaw] = useState<UserProfile>(() => loadFromStorage('profile', defaultProfile));
  const [settings, setSettingsRaw] = useState<AppSettings>(() => loadFromStorage('settings', defaultSettings));
  const [onboarding, setOnboardingRaw] = useState<OnboardingData>(() => {
    const stored = loadFromStorage('onboarding', {
      completed: false,
      currentStep: 0,
      profile: defaultProfile,
      absence: defaultAbsence,
      categories: defaultCategories,
      contacts: defaultContacts,
    });
    // Migrate older stored shapes that predate tasksForMe/custom keys
    return {
      ...stored,
      categories: { ...defaultCategories, ...stored.categories, custom: stored.categories?.custom || [] },
    };
  });
  const [manualCategories, setManualCategoriesRaw] = useState<Record<string, string>>(() => loadFromStorage('manualCats', {}));
  const [currentPlan, setCurrentPlanRaw] = useState<'trial' | 'free' | 'premium'>(() => loadFromStorage('plan', 'trial'));
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Trial: 14 days counted from first app use, persisted
  const [firstUseDate] = useState<string>(() => {
    const stored = loadFromStorage<string | null>('firstUse', null);
    if (stored) return stored;
    const today = new Date().toISOString().split('T')[0];
    saveToStorage('firstUse', today);
    return today;
  });
  const daysUsed = Math.floor((Date.now() - new Date(firstUseDate).getTime()) / 86400000);
  const trialDaysRemaining = Math.max(0, TRIAL_DAYS - daysUsed);

  // i18n — bound to the language chosen in settings
  const t = (key: string) => translate(key, settings.language as Locale);

  // Persist on change
  const setView = (v: string) => {
    setViewHistory(prev => [...prev.slice(-20), view]);
    setViewRaw(v);
    saveToStorage('view', v);
  };

  const goBack = () => {
    const prev = viewHistory[viewHistory.length - 1];
    if (prev) {
      setViewHistory(h => h.slice(0, -1));
      setViewRaw(prev);
      saveToStorage('view', prev);
    }
  };

  const setUserProfile = (p: UserProfile | ((prev: UserProfile) => UserProfile)) => {
    setUserProfileRaw(prev => {
      const next = typeof p === 'function' ? p(prev) : p;
      saveToStorage('profile', next);
      return next;
    });
  };

  const setSettings = (s: AppSettings | ((prev: AppSettings) => AppSettings)) => {
    setSettingsRaw(prev => {
      const next = typeof s === 'function' ? s(prev) : s;
      saveToStorage('settings', next);
      return next;
    });
  };

  const setOnboarding = (o: OnboardingData | ((prev: OnboardingData) => OnboardingData)) => {
    setOnboardingRaw(prev => {
      const next = typeof o === 'function' ? o(prev) : o;
      saveToStorage('onboarding', next);
      return next;
    });
  };

  const setManualCategory = (emailId: string, category: string) => {
    setManualCategoriesRaw(prev => {
      const next = { ...prev, [emailId]: category };
      saveToStorage('manualCats', next);
      return next;
    });
  };

  const setCurrentPlan = (p: 'trial' | 'free' | 'premium') => {
    setCurrentPlanRaw(p);
    saveToStorage('plan', p);
  };

  /**
   * The effective absence window used for email processing (M2):
   * an "after absence" range (unplanned absence) wins over the planned
   * "before absence" range; falls back to the last 14 days.
   */
  const getAbsenceWindow = (): { start: string; end: string } => {
    const a = onboarding.absence;
    if (a.afterAbsenceStart && a.afterAbsenceEnd) return { start: a.afterAbsenceStart, end: a.afterAbsenceEnd };
    if (a.beforeAbsenceStart && a.beforeAbsenceEnd) return { start: a.beforeAbsenceStart, end: a.beforeAbsenceEnd };
    return { start: isoDaysAgo(14), end: isoDaysAgo(0) };
  };

  // Toast auto-dismiss
  const triggerToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Dark mode effect
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  // Keep <html lang> in sync with the chosen language
  useEffect(() => {
    document.documentElement.lang = settings.language;
  }, [settings.language]);

  return (
    <AppContext.Provider value={{
      view, setView, viewHistory, goBack,
      userProfile, setUserProfile,
      settings, setSettings, t,
      onboarding, setOnboarding, getAbsenceWindow,
      manualCategories, setManualCategory,
      trialDaysRemaining, currentPlan, setCurrentPlan,
      toast, triggerToast,
      isAuthenticated, setIsAuthenticated,
    }}>
      {children}
      {/* Global Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </AppContext.Provider>
  );
}

// ── Hook ──
export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
