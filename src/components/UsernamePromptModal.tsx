'use client';

import { useState, useEffect } from 'react';
import { updateProfile } from '@/app/profile/actions';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Loader2,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';

interface UsernamePromptModalProps {
  currentName: string;
}

export default function UsernamePromptModal({ currentName }: UsernamePromptModalProps) {
  const { update: updateSession } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [newName, setNewName] = useState(currentName.replace(/\s+/g, '_'));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // 1. Kolla om namnet innehåller mellanslag
    const hasSpace = currentName.includes(' ');
    
    // 2. Kolla om användaren redan stängt modalen med FLIT (utan att byta namn)
    //    eller om de redan lyckats byta namn tidigare.
    const hasDismissed = localStorage.getItem(`dismissed_username_${currentName}`);

    if (hasSpace && !hasDismissed) {
      setIsOpen(true);
    }
  }, [currentName]);

  const handleClose = () => {
    // Spara att DE HÄR SPECIFIKA namnet har "bevisligen" dismissats av användaren
    localStorage.setItem(`dismissed_username_${currentName}`, 'true');
    setIsOpen(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (newName.includes(' ')) {
      setError('Mellanslag är inte tillåtna i användarnamnet. Använd understreck (_) eller bindestreck (-) istället.');
      setIsLoading(false);
      return;
    }

    if (newName.length < 2) {
      setError('Namnet måste vara minst 2 tecken långt.');
      setIsLoading(false);
      return;
    }

    if (newName.length > 20) {
      setError('Namnet får vara max 20 tecken långt.');
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('name', newName);

    const result = await updateProfile(formData);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      setSuccess(true);
      setIsLoading(false);
      
      // Tvinga klient-sessionen att uppdatera sig mot servern (som nu läser nya dbUser.name)
      await updateSession();
      
      setTimeout(() => {
        setIsOpen(false);
        router.refresh();
      }, 1500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={handleClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-card border-2 border-primary/20 rounded-[2rem] shadow-2xl w-full max-w-md p-6 md:p-8 animate-in zoom-in-95 duration-300 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={20} />
        </button>

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-2">
              <UserIcon className="text-primary w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight">Välj ett Smeknamn</h2>
            <p className="text-sm text-muted-foreground font-medium">
              Du loggade in med ditt fulla namn. Vill du byta till ett kortare smeknamn som syns i ligorna?
            </p>
          </div>

          {!success ? (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="nickname" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Ditt nya namn (inga mellanslag)
                </label>
                <div className="relative">
                  <input
                    id="nickname"
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value.replace(/\s+/g, '_'))}
                    placeholder="t.ex. super_tipparen"
                    className="w-full bg-secondary/50 border-2 border-border focus:border-primary rounded-2xl px-5 py-3 outline-none font-bold transition-all text-lg"
                    disabled={isLoading}
                    autoFocus
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground uppercase">
                    {newName.length}/20
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-xl border border-destructive/20 text-xs font-bold animate-in slide-in-from-top-1">
                  <AlertCircle size={14} className="shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary text-primary-foreground h-14 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin w-5 h-5" />
                  ) : (
                    'Spara Smeknamn'
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full bg-transparent text-muted-foreground h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:text-foreground transition-colors"
                >
                  Behåll nuvarande namn
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 space-y-4 animate-in fade-in duration-500">
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="text-primary w-10 h-10" />
              </div>
              <div className="text-center">
                <p className="text-xl font-black uppercase tracking-tight">Snyggt!</p>
                <p className="text-sm text-muted-foreground">Ditt namn har uppdaterats.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
