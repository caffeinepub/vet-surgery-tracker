import { useState } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useGetCallerUserProfile, useIsCallerAdmin } from './hooks/useQueries';
import ProfileSetupModal from './features/auth/components/ProfileSetupModal';
import LoginButton from './features/auth/components/LoginButton';
import DashboardView from './features/dashboard/components/DashboardView';
import CasesListView from './features/cases/components/CasesListView';
import SettingsView from './features/settings/components/SettingsView';
import CaseFormDialog from './features/cases/components/CaseFormDialog';
import { LayoutDashboard, List, Settings, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

type View = 'dashboard' | 'cases' | 'settings';

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity;

  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [newCaseOpen, setNewCaseOpen] = useState(false);
  const [highlightedCaseId, setHighlightedCaseId] = useState<bigint | null>(null);

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetCallerUserProfile();

  const { data: isAdmin } = useIsCallerAdmin();

  const showProfileSetup =
    isAuthenticated && !profileLoading && profileFetched && userProfile === null;

  const handleCaseCreated = (caseId: bigint) => {
    setHighlightedCaseId(caseId);
    setCurrentView('dashboard');
    setTimeout(() => setHighlightedCaseId(null), 4000);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading SurgiPaw…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="border-b border-border bg-card/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/assets/generated/surgery-case-log-favicon.dim_64x64.png" alt="SurgiPaw" className="w-7 h-7" />
              <span className="font-bold text-lg tracking-tight text-foreground">SurgiPaw</span>
            </div>
            <LoginButton />
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <img src="/assets/generated/surgery-case-log-icon.dim_512x512.png" alt="SurgiPaw" className="w-24 h-24 mx-auto mb-6 rounded-2xl shadow-lg" />
            <h1 className="text-3xl font-bold text-foreground mb-2">SurgiPaw</h1>
            <p className="text-muted-foreground mb-8">Veterinary surgery case management, simplified.</p>
            <LoginButton />
          </div>
        </main>
        <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} SurgiPaw — Built with ❤️ using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            caffeine.ai
          </a>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Navigation Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <img src="/assets/generated/surgery-case-log-favicon.dim_64x64.png" alt="SurgiPaw" className="w-7 h-7" />
            <span className="font-bold text-base tracking-tight text-foreground hidden sm:block">SurgiPaw</span>
          </div>

          {/* Nav + Actions */}
          <div className="flex items-center gap-1">
            {/* + New Case button — left of Dashboard */}
            <Button
              size="sm"
              className="gap-1.5 h-8 text-xs font-semibold"
              onClick={() => setNewCaseOpen(true)}
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Case</span>
              <span className="sm:hidden">New</span>
            </Button>

            <div className="w-px h-5 bg-border mx-1" />

            {/* Dashboard */}
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-medium transition-colors ${
                currentView === 'dashboard'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>

            {/* Cases */}
            <button
              onClick={() => setCurrentView('cases')}
              className={`flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-medium transition-colors ${
                currentView === 'cases'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cases</span>
            </button>

            {/* Settings (admin only) */}
            {isAdmin && (
              <button
                onClick={() => setCurrentView('settings')}
                className={`flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-medium transition-colors ${
                  currentView === 'settings'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Settings</span>
              </button>
            )}

            <div className="w-px h-5 bg-border mx-1" />

            {/* User info + logout */}
            <div className="flex items-center gap-2">
              {userProfile && (
                <span className="text-xs text-muted-foreground hidden md:block max-w-[120px] truncate">
                  {userProfile.name}
                </span>
              )}
              <LoginButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {currentView === 'dashboard' && (
          <DashboardView
            onNewCase={() => setNewCaseOpen(true)}
            highlightedCaseId={highlightedCaseId}
          />
        )}
        {currentView === 'cases' && (
          <CasesListView onNewCase={() => setNewCaseOpen(true)} />
        )}
        {currentView === 'settings' && isAdmin && <SettingsView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-3 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} SurgiPaw — Built with ❤️ using{' '}
        <a
          href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
        >
          caffeine.ai
        </a>
      </footer>

      {/* New Case Dialog */}
      <CaseFormDialog
        open={newCaseOpen}
        onOpenChange={setNewCaseOpen}
        onCaseCreated={handleCaseCreated}
      />

      {/* Profile Setup Modal */}
      <ProfileSetupModal open={showProfileSetup} />
    </div>
  );
}
