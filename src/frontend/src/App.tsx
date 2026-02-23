import { useEffect, useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useActor } from './hooks/useActor';
import { useGetCallerUserProfile, useIsCallerAdmin } from './hooks/useQueries';
import AuthView from './features/auth/components/AuthView';
import LogoutButton from './features/auth/components/LogoutButton';
import ProfileSetupModal from './features/auth/components/ProfileSetupModal';
import CasesListView from './features/cases/components/CasesListView';
import SettingsView from './features/settings/components/SettingsView';
import DashboardView from './features/dashboard/components/DashboardView';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Settings, LayoutDashboard, FolderOpen } from 'lucide-react';

type View = 'dashboard' | 'cases' | 'settings';

export default function App() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { actor, isFetching: actorFetching } = useActor();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedCaseId, setSelectedCaseId] = useState<bigint | null>(null);
  const [isNewCaseDialogOpen, setIsNewCaseDialogOpen] = useState(false);

  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  // Defensive guard: ensure no dark class is ever applied
  useEffect(() => {
    const removeAnyDarkClass = () => {
      const html = document.documentElement;
      if (html.classList.contains('dark')) {
        html.classList.remove('dark');
      }
    };

    // Remove immediately
    removeAnyDarkClass();

    // Watch for any changes
    const observer = new MutationObserver(removeAnyDarkClass);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const handleNavigateToCase = (caseId: bigint) => {
    setSelectedCaseId(caseId);
    setCurrentView('cases');
  };

  const handleClearSelectedCase = () => {
    setSelectedCaseId(null);
  };

  const handleNewCaseFromDashboard = () => {
    setCurrentView('cases');
    // Small delay to ensure the view switches before opening dialog
    setTimeout(() => {
      setIsNewCaseDialogOpen(true);
    }, 100);
  };

  if (authLoading) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false}>
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="text-foreground font-medium">Loading...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  if (!isAuthenticated) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false}>
        <AuthView />
        <Toaster />
      </ThemeProvider>
    );
  }

  if (!actor || actorFetching) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false}>
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="text-foreground font-medium">Connecting to backend...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false}>
      <div className="flex min-h-screen flex-col bg-background">
        <header className="border-b bg-card backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <img 
                src="/assets/image-1.png" 
                alt="SurgiPaw" 
                className="h-10 w-10 rounded-lg"
              />
              <h1 className="text-2xl font-bold text-foreground">SurgiPaw</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={currentView === 'dashboard' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('dashboard')}
                className="gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>
              <Button
                variant={currentView === 'cases' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('cases')}
                className="gap-2"
              >
                <FolderOpen className="h-4 w-4" />
                Cases
              </Button>
              {!adminLoading && isAdmin && (
                <Button
                  variant={currentView === 'settings' ? 'default' : 'ghost'}
                  onClick={() => setCurrentView('settings')}
                  className="gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              )}
              <LogoutButton />
            </div>
          </div>
        </header>

        <main className="flex-1 container mx-auto px-4 py-8">
          {currentView === 'dashboard' && (
            <DashboardView 
              onNavigateToCase={handleNavigateToCase}
              onNewCase={handleNewCaseFromDashboard}
            />
          )}
          {currentView === 'cases' && (
            <CasesListView 
              selectedCaseId={selectedCaseId}
              onClearSelectedCase={handleClearSelectedCase}
              isNewCaseDialogOpen={isNewCaseDialogOpen}
              onNewCaseDialogChange={setIsNewCaseDialogOpen}
            />
          )}
          {currentView === 'settings' && isAdmin && <SettingsView />}
        </main>

        <footer className="border-t bg-card backdrop-blur-sm py-6 mt-auto">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} · Built with ❤️ using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </div>
        </footer>

        <ProfileSetupModal open={showProfileSetup} />
        <Toaster />
      </div>
    </ThemeProvider>
  );
}
