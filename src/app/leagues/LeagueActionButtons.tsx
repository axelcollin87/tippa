'use client';

import { Trash2, LogOut } from 'lucide-react';
import { deleteLeague, leaveLeague } from './actions';
import { useState } from 'react';

export function DeleteLeagueButton({ leagueId }: { leagueId: string }) {
  const [isPending, setIsPending] = useState(false);

  async function handleDelete() {
    if (confirm('Är du helt säker på att du vill radera denna liga? All historik och chat försvinner.')) {
      setIsPending(true);
      try {
        await deleteLeague(leagueId);
      } catch (error) {
        console.error(error);
        setIsPending(false);
      }
    }
  }

  return (
    <button 
      onClick={handleDelete}
      disabled={isPending}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all font-bold text-xs uppercase disabled:opacity-50"
    >
      <Trash2 size={14} /> {isPending ? 'Raderar...' : 'Radera'}
    </button>
  );
}

export function LeaveLeagueButton({ leagueId }: { leagueId: string }) {
  const [isPending, setIsPending] = useState(false);

  async function handleLeave() {
    if (confirm('Vill du verkligen lämna denna liga?')) {
      setIsPending(true);
      try {
        await leaveLeague(leagueId);
      } catch (error) {
        console.error(error);
        setIsPending(false);
      }
    }
  }

  return (
    <button 
      onClick={handleLeave}
      disabled={isPending}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-all font-bold text-xs uppercase disabled:opacity-50"
    >
      <LogOut size={14} /> {isPending ? 'Lämnar...' : 'Lämna'}
    </button>
  );
}
