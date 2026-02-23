import { useState } from 'react';
import LoginForm from './LoginForm';
import RegistrationForm from './RegistrationForm';

type AuthMode = 'login' | 'register';

export default function AuthView() {
  const [mode, setMode] = useState<AuthMode>('login');

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b bg-card backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <img 
              src="/assets/image-1.png" 
              alt="SurgiPaw" 
              className="h-12 w-12 rounded-lg"
            />
            <h1 className="text-2xl font-bold text-foreground">SurgiPaw</h1>
          </div>
        </div>
      </header>
      
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        {mode === 'login' ? (
          <LoginForm onSwitchToRegister={() => setMode('register')} />
        ) : (
          <RegistrationForm onSwitchToLogin={() => setMode('login')} />
        )}
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
  );
}
