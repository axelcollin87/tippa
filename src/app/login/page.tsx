"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { registerUser } from "./actions";

export default function LoginPage() {
  const router = useRouter();
  const [isLoginMode, setIsLoginMode] = useState(true);
  
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    if (isLoginMode) {
      // INLOGGNING
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
      } else {
        router.push("/");
        router.refresh();
      }
    } else {
      // REGISTRERING
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);

      const res = await registerUser(formData);
      
      if (res.error) {
        setError(res.error);
      } else if (res.success) {
        setSuccessMsg(res.message || "Konto skapat.");
        setIsLoginMode(true); // Hoppa tillbaka till inloggning
        setPassword(""); // Rensa lösenordet för säkerhet
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center font-bold text-3xl text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.5)]">
            VM
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-foreground tracking-tight">
          {isLoginMode ? "Tippa Fotbolls-VM" : "Skapa ett konto"}
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {isLoginMode 
            ? "Logga in för att se ligan." 
            : "Registrera dig. En admin måste sedan godkänna dig."}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card border border-border py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit} method="POST">
            
            {!isLoginMode && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground">
                  Ditt Namn
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
                    placeholder="För- och efternamn"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
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
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
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
                  isLoading ? 'bg-primary/70 cursor-not-allowed' : 'bg-primary hover:bg-primary/90 shadow-[0_0_15px_rgba(var(--primary),0.3)]'
                } focus:outline-none focus:ring-2 focus:ring-primary transition-all`}
              >
                {isLoading ? "Vänta..." : (isLoginMode ? "Logga in" : "Registrera dig")}
              </button>
            </div>
            
            <div className="text-center mt-4">
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
                  ? "Inget konto? Registrera dig här." 
                  : "Har du redan ett konto? Logga in."}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
