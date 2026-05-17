'use client';

export const dynamic = 'force-dynamic';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { registerUser } from './actions';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoginMode, setIsLoginMode] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    if (isLoginMode) {
      // INLOGGNING
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
      } else {
        const callbackUrl = searchParams.get('callbackUrl');
        router.push(callbackUrl || '/');
        router.refresh();
      }
    } else {
      // REGISTRERING
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('password', password);

      const res = await registerUser(formData);

      if (res.error) {
        setError(res.error);
      } else if (res.success) {
        setSuccessMsg(res.message || 'Konto skapat.');
        setIsLoginMode(true); // Hoppa tillbaka till inloggning
        setPassword(''); // Rensa lösenordet för säkerhet
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-46 h-16 bg-primary rounded-xl flex items-center justify-center font-bold text-3xl text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.5)]">
            TIPPWITS
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-foreground tracking-tight">
          {isLoginMode ? 'Tippa Fotbolls-VM' : 'Skapa ett konto'}
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {isLoginMode
            ? ''
            : 'Registrera dig. En admin måste sedan godkänna dig.'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card border border-border py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLoginMode && (
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-foreground"
                >
                  Namn
                </label>
                <div className="mt-2">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required={!isLoginMode}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="appearance-none block w-full px-3 py-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm"
                    placeholder="Namn/Användarnamn"
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground"
              >
                E-postadress
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm"
                  placeholder="din@email.se"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground"
              >
                Lösenord
              </label>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 border-l-4 border-destructive p-4 rounded-r-lg">
                <p className="text-sm font-medium text-destructive">{error}</p>
              </div>
            )}

            {successMsg && (
              <div className="bg-primary/10 border-l-4 border-primary p-4 rounded-r-lg">
                <p className="text-sm font-medium text-primary">{successMsg}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-primary-foreground ${
                  isLoading
                    ? 'bg-primary/70 cursor-not-allowed'
                    : 'bg-primary hover:bg-primary/90 shadow-[0_0_15px_rgba(var(--primary),0.3)]'
                } focus:outline-none focus:ring-2 focus:ring-primary transition-all`}
              >
                {isLoading
                  ? 'Vänta...'
                  : isLoginMode
                    ? 'Logga in'
                    : 'Registrera dig'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm font-medium leading-6">
                <span className="bg-card px-4 text-muted-foreground uppercase tracking-widest text-[10px]">
                  Eller fortsätt med
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => signIn('google', { callbackUrl: '/' })}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-bold border border-border rounded-lg shadow-sm bg-background hover:bg-secondary/50 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.18 1-.78 1.85-1.63 2.42v2.85h2.64c1.55-1.42 2.43-3.5 2.43-5.28z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-2.64-2.05c-.73.49-1.66.78-2.64.78-2.03 0-3.75-1.37-4.36-3.22H2.02v2.16C3.84 21.39 7.72 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M7.64 15.85c-.15-.45-.24-.93-.24-1.42s.09-.97.24-1.42V10.85H2.02c-.51 1.05-.8 2.21-.8 3.4s.29 2.35.8 3.4l5.62-4.4z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.72 1 3.84 2.61 2.02 5.77L7.64 10.1c.61-1.85 2.33-3.22 4.36-3.22z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </button>
            </div>
          </div>

          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => {
                setIsLoginMode(!isLoginMode);
                setError(null);
                setSuccessMsg(null);
              }}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLoginMode
                ? 'Inget konto? Registrera dig här.'
                : 'Har du redan ett konto? Logga in.'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Laddar inloggning...</div>}>
      <LoginContent />
    </Suspense>
  );
}
