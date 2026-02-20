import { useEffect, useState } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useActor } from './hooks/useActor';
import { useGetCallerUserProfile, useIsCallerAdmin } from './hooks/useQueries';
import LoginButton from './features/auth/components/LoginButton';
import ProfileSetupModal from './features/auth/components/ProfileSetupModal';
import CasesListView from './features/cases/components/CasesListView';
import SettingsView from './features/settings/components/SettingsView';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Settings, AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type View = 'cases' | 'settings';

export default function App() {
  const { identity, isInitializing, login, clear } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const [currentView, setCurrentView] = useState<View>('cases');

  const isAuthenticated = !!identity;
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

  const handleRetry = async () => {
    try {
      await clear();
      setTimeout(() => {
        login();
      }, 300);
    } catch (error) {
      console.error('Retry failed:', error);
    }
  };

  if (isInitializing) {
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
        <div className="flex min-h-screen flex-col bg-background">
          <header className="border-b bg-card backdrop-blur-sm">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <img 
                  src="/assets/image-1.png" 
                  alt="Surgery Case Log" 
                  className="h-12 w-12 rounded-lg"
                />
                <h1 className="text-2xl font-bold text-foreground">Surgery Case Log</h1>
              </div>
              <LoginButton />
            </div>
          </header>
          <main className="flex flex-1 items-center justify-center px-4">
            <div className="max-w-md text-center">
              <img 
                src="/assets/image-1.png" 
                alt="Surgery Case Log" 
                className="mb-8 h-32 w-32 mx-auto rounded-2xl shadow-lg"
              />
              <h2 className="mb-4 text-3xl font-bold text-foreground">Welcome to Surgery Case Log</h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Track and manage veterinary surgery cases with ease. Please log in to continue.
              </p>
              <LoginButton />
            </div>
          </main>
          <footer className="border-t bg-card backdrop-blur-sm py-6">
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
        </div>
        <Toaster />
      </ThemeProvider>
    );
  }

  // Show loading state while actor is initializing
  if (actorFetching || !actor) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false}>
        <div className="flex min-h-screen flex-col bg-background">
          <header className="border-b bg-card backdrop-blur-sm">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <img 
                  src="/assets/image-1.png" 
                  alt="Surgery Case Log" 
                  className="h-12 w-12 rounded-lg"
                />
                <h1 className="text-2xl font-bold text-foreground">Surgery Case Log</h1>
              </div>
              <div className="flex items-center gap-4">
                {userProfile && (
                  <span className="text-sm text-muted-foreground">
                    Welcome, <span className="font-medium text-foreground">{userProfile.name}</span>
                  </span>
                )}
                <LoginButton />
              </div>
            </div>
          </header>
          <main className="flex flex-1 items-center justify-center px-4">
            <div className="text-center max-w-md">
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
              <p className="text-foreground font-medium mb-2">Connecting to backend...</p>
              <p className="text-sm text-muted-foreground">Please wait while we establish a secure connection.</p>
            </div>
          </main>
          <footer className="border-t bg-card backdrop-blur-sm py-6">
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
        </div>
        <Toaster />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false}>
      <div className="flex min-h-screen flex-col bg-background">
        <header className="border-b bg-card backdrop-blur-sm">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <img 
                src="/assets/image-1.png" 
                alt="Surgery Case Log" 
                className="h-12 w-12 rounded-lg"
              />
              <h1 className="text-2xl font-bold text-foreground">Surgery Case Log</h1>
            </div>
            <div className="flex items-center gap-4">
              {userProfile && (
                <span className="text-sm text-muted-foreground">
                  Welcome, <span className="font-medium text-foreground">{userProfile.name}</span>
                </span>
              )}
              {isAdmin && !adminLoading && (
                <Button
                  variant={currentView === 'settings' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentView(currentView === 'settings' ? 'cases' : 'settings')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {currentView === 'settings' ? 'Back to Cases' : 'Settings'}
                </Button>
              )}
              <LoginButton />
            </div>
          </div>
        </header>
        <main className="flex-1 container mx-auto px-4 py-8">
          {currentView === 'cases' && <CasesListView />}
          {currentView === 'settings' && isAdmin && <SettingsView />}
        </main>
        <footer className="border-t bg-card backdrop-blur-sm py-6">
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
      </div>
      <ProfileSetupModal open={showProfileSetup} />
      <Toaster />
    </ThemeProvider>
  );
}
