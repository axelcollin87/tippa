'use client';

import { useState } from 'react';
import { Plus, Check, Link as LinkIcon } from 'lucide-react';
import { createLeague } from './actions';

export default function CreateLeagueForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    
    const formData = new FormData(e.currentTarget);
    try {
      await createLeague(formData);
      setIsOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsPending(false);
    }
  }

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20 px-4 py-2 rounded-xl font-bold text-sm transition-all"
      >
        <Plus size={16} /> SKAPA LIGA
      </button>
    );
  }

  return (
    <div className="bg-card border border-border p-4 rounded-2xl shadow-lg w-full md:w-80 relative animate-in fade-in slide-in-from-top-4">
      <h3 className="font-black text-sm uppercase mb-3 text-foreground">Ny Liga</h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          name="name"
          placeholder="Ligans namn..."
          className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          required
          minLength={3}
          autoFocus
          disabled={isPending}
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex-1 bg-secondary text-foreground py-2 rounded-lg text-xs font-bold uppercase hover:bg-secondary/80 transition-colors"
            disabled={isPending}
          >
            Avbryt
          </button>
          <button
            type="submit"
            className="flex-1 flex justify-center items-center gap-1 bg-primary text-primary-foreground py-2 rounded-lg text-xs font-bold uppercase hover:opacity-90 transition-opacity"
            disabled={isPending}
          >
            {isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Spara'}
          </button>
        </div>
      </form>
    </div>
  );
}
