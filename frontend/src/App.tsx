import { useState } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import LoginButton from './features/auth/components/LoginButton';
import ProfileSetupModal from './features/auth/components/ProfileSetupModal';
import DashboardView from './features/dashboard/components/DashboardView';
import CasesListView from './features/cases/components/CasesListView';
import { LayoutDashboard, FolderOpen } from 'lucide-react';

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const [currentView, setCurrentView] = useState<'dashboard' | 'cases'>('dashboard');
  const [highlightCaseId, setHighlightCaseId] = useState<number | null>(null);

  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();

  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  const handleNavigateToCase = (caseId: number) => {
    setHighlightCaseId(caseId);
    setCurrentView('cases');
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-4">
          <img src="/assets/IMG_4505.ico" alt="SurgiPaw" className="w-20 h-20 object-contain" />
          <h1 className="text-3xl font-bold text-foreground">SurgiPaw</h1>
          <p className="text-muted-foreground text-center max-w-sm">
            Veterinary surgery case management. Please log in to continue.
          </p>
        </div>
        <LoginButton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/assets/IMG_4505.ico" alt="SurgiPaw" className="w-9 h-9 object-contain" />
            <span className="font-bold text-lg text-foreground">SurgiPaw</span>
          </div>

          <nav className="flex items-center gap-1">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'dashboard'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
            <button
              onClick={() => { setCurrentView('cases'); setHighlightCaseId(null); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'cases'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Cases</span>
            </button>
          </nav>

          <div className="flex items-center gap-2">
            {userProfile && (
              <span className="text-sm text-muted-foreground hidden md:block">{userProfile.name}</span>
            )}
            <LoginButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-screen-2xl mx-auto w-full px-4 py-6">
        {currentView === 'dashboard' && (
          <DashboardView onNavigateToCase={handleNavigateToCase} />
        )}
        {currentView === 'cases' && (
          <CasesListView
            highlightCaseId={highlightCaseId}
            onHighlightClear={() => setHighlightCaseId(null)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 px-4 text-center text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} SurgiPaw. Built with ❤️ using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'surgipaw')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            caffeine.ai
          </a>
        </span>
      </footer>

      {showProfileSetup && <ProfileSetupModal open={showProfileSetup} />}
    </div>
  );
}
