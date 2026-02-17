import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import LoginButton from './features/auth/components/LoginButton';
import ProfileSetupModal from './features/auth/components/ProfileSetupModal';
import CasesListView from './features/cases/components/CasesListView';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  if (isInitializing) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="text-blue-900 dark:text-blue-100 font-medium">Loading...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  if (!isAuthenticated) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
          <header className="border-b border-blue-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
              <h1 className="text-2xl font-bold text-blue-900 dark:text-blue-100">Vet Surgery Tracker</h1>
              <LoginButton />
            </div>
          </header>
          <main className="flex flex-1 items-center justify-center px-4">
            <div className="max-w-md text-center">
              <div className="mb-8 text-6xl">🏥</div>
              <h2 className="mb-4 text-3xl font-bold text-blue-900 dark:text-blue-100">Welcome to Vet Surgery Tracker</h2>
              <p className="mb-8 text-lg text-blue-700 dark:text-blue-300">
                Track and manage veterinary surgery cases with ease. Please log in to continue.
              </p>
              <LoginButton />
            </div>
          </main>
          <footer className="border-t border-blue-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm py-6">
            <div className="container mx-auto px-4 text-center text-sm text-blue-600 dark:text-blue-400">
              © {new Date().getFullYear()} · Built with ❤️ using{' '}
              <a
                href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:underline"
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
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
        <header className="border-b border-blue-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <h1 className="text-2xl font-bold text-blue-900 dark:text-blue-100">Vet Surgery Tracker</h1>
            <div className="flex items-center gap-4">
              {userProfile && (
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  Welcome, <span className="font-medium">{userProfile.name}</span>
                </span>
              )}
              <LoginButton />
            </div>
          </div>
        </header>
        <main className="flex-1 container mx-auto px-4 py-8">
          <CasesListView />
        </main>
        <footer className="border-t border-blue-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm py-6">
          <div className="container mx-auto px-4 text-center text-sm text-blue-600 dark:text-blue-400">
            © {new Date().getFullYear()} · Built with ❤️ using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:underline"
            >
              caffeine.ai
            </a>
          </div>
        </footer>
      </div>
      {showProfileSetup && <ProfileSetupModal />}
      <Toaster />
    </ThemeProvider>
  );
}
