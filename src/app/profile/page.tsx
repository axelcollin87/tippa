'use client';

import { useState } from 'react';
import { updateProfile, updatePassword } from './actions';
import { useSession } from 'next-auth/react';
import { User, Lock, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });
  const [isProfilePending, setIsProfilePending] = useState(false);
  const [isPasswordPending, setIsPasswordPending] = useState(false);

  if (!session) return null;

  async function handleProfileSubmit(formData: FormData) {
    setIsProfilePending(true);
    setProfileMsg({ type: '', text: '' });
    const result = await updateProfile(formData);
    setIsProfilePending(false);

    if (result.success) {
      setProfileMsg({ type: 'success', text: result.success });
      // Uppdatera sessionen lokalt för att visa det nya namnet i UI
      await update({ name: formData.get('name') });
    } else {
      setProfileMsg({ type: 'error', text: result.error || 'Något gick fel' });
    }
  }

  async function handlePasswordSubmit(formData: FormData) {
    setIsPasswordPending(true);
    setPasswordMsg({ type: '', text: '' });
    const result = await updatePassword(formData);
    setIsPasswordPending(false);

    if (result.success) {
      setPasswordMsg({ type: 'success', text: result.success });
      (document.getElementById('password-form') as HTMLFormElement).reset();
    } else {
      setPasswordMsg({ type: 'error', text: result.error || 'Något gick fel' });
    }
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
          Din Profil
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Hantera dina personliga inställningar.
        </p>
      </div>

      {/* NAMN / NICKNAME */}
      <section className="bg-card p-6 rounded-2xl shadow-lg border border-border space-y-6">
        <div className="flex items-center gap-2 border-b border-border pb-4">
          <User className="text-primary" size={20} />
          <h2 className="text-xl font-bold text-foreground">Ändra Nickname</h2>
        </div>

        <form action={handleProfileSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="text-xs font-black uppercase tracking-widest text-muted-foreground"
            >
              Ditt namn i listorna
            </label>
            <input
              type="text"
              id="name"
              name="name"
              defaultValue={session.user.name || ''}
              required
              className="w-full p-3 border border-border rounded-xl bg-background text-foreground font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          </div>

          {profileMsg.text && (
            <div
              className={`flex items-center gap-2 text-sm p-3 rounded-xl ${profileMsg.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'}`}
            >
              {profileMsg.type === 'success' ? (
                <CheckCircle2 size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              {profileMsg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={isProfilePending}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-black uppercase tracking-widest text-sm transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            {isProfilePending ? (
              'Sparar...'
            ) : (
              <>
                <Save size={18} /> Spara ändringar
              </>
            )}
          </button>
        </form>
      </section>

      {/* LÖSENORD */}
      <section className="bg-card p-6 rounded-2xl shadow-lg border border-border space-y-6">
        <div className="flex items-center gap-2 border-b border-border pb-4">
          <Lock className="text-primary" size={20} />
          <h2 className="text-xl font-bold text-foreground">Byt Lösenord</h2>
        </div>

        <form
          id="password-form"
          action={handlePasswordSubmit}
          className="space-y-4"
        >
          <div className="space-y-2">
            <label
              htmlFor="currentPassword"
              id="tour-password-current"
              className="text-xs font-black uppercase tracking-widest text-muted-foreground"
            >
              Nuvarande lösenord
            </label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              required
              className="w-full p-3 border border-border rounded-xl bg-background text-foreground font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="newPassword"
                className="text-xs font-black uppercase tracking-widest text-muted-foreground"
              >
                Nytt lösenord
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                required
                minLength={6}
                className="w-full p-3 border border-border rounded-xl bg-background text-foreground font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="text-xs font-black uppercase tracking-widest text-muted-foreground"
              >
                Bekräfta nytt
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                required
                className="w-full p-3 border border-border rounded-xl bg-background text-foreground font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>
          </div>

          {passwordMsg.text && (
            <div
              className={`flex items-center gap-2 text-sm p-3 rounded-xl ${passwordMsg.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'}`}
            >
              {passwordMsg.type === 'success' ? (
                <CheckCircle2 size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              {passwordMsg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={isPasswordPending}
            className="w-full flex items-center justify-center gap-2 bg-secondary text-foreground py-3 rounded-xl font-black uppercase tracking-widest text-sm transition-all hover:bg-secondary/80 disabled:opacity-50 border border-border"
          >
            {isPasswordPending ? (
              'Uppdaterar...'
            ) : (
              <>
                <Lock size={18} /> Uppdatera lösenord
              </>
            )}
          </button>
        </form>
      </section>
    </div>
  );
}
