'use client';

import { useState, useEffect } from 'react';
import { finalizeGroupStandings } from '@/app/admin/actions';
import { ChevronUp, ChevronDown, CheckCircle2, Lock } from 'lucide-react';

interface Props {
  groupName: string;
  teams: string[];
  initialIsFinalized?: boolean;
}

export default function AdminGroupStandings({ groupName, teams, initialIsFinalized = false }: Props) {
  const [orderedTeams, setOrderedTeams] = useState<string[]>(teams);
  const [isLoading, setIsLoading] = useState(false);
  const [isFinalized, setIsFinalized] = useState(initialIsFinalized);
  const [error, setError] = useState<string | null>(null);

  // Synka state om teams ändras (t.ex. vid sync eller radering)
  useEffect(() => {
    setOrderedTeams(teams);
    setIsFinalized(initialIsFinalized);
  }, [teams, initialIsFinalized]);

  const move = (index: number, direction: 'up' | 'down') => {
    if (isLoading) return;

    const newOrder = [...orderedTeams];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newOrder.length) return;

    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    setOrderedTeams(newOrder);
    setIsFinalized(false); // Om vi ändrar ordningen är den inte längre "sparad" för denna ordning i UI:t
    setError(null);
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('groupName', groupName);
    orderedTeams.forEach((team, i) => {
      formData.append(`rank${i + 1}`, team);
    });

    try {
      await finalizeGroupStandings(formData);
      setIsFinalized(true);
    } catch (err: any) {
      setError(err.message || 'Något gick fel.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`p-5 rounded-xl border transition-all ${isFinalized ? 'bg-primary/5 border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.1)]' : 'bg-secondary/30 border-border'}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-black text-foreground uppercase tracking-wide text-sm">
          Grupp {groupName}
        </h3>
        {isFinalized && (
          <span className="flex items-center gap-1 text-[10px] font-black uppercase text-primary tracking-widest">
            <CheckCircle2 size={14} /> Fastställd
          </span>
        )}
      </div>

      <div className="divide-y divide-border/50 bg-background/50 rounded-lg border border-border/50 mb-4">
        {orderedTeams.map((team, index) => {
          const rank = index + 1;
          const isAdvancing = rank <= 2;

          return (
            <div key={team} className="flex items-center p-2 gap-3 group">
              <div
                className={`w-6 h-6 rounded flex items-center justify-center font-black text-xs shrink-0 ${
                  isAdvancing
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                {rank}
              </div>

              <div className="flex-1 font-bold text-sm text-foreground">
                {team}
              </div>

              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => move(index, 'up')}
                  disabled={index === 0 || isLoading}
                  className="p-1 hover:bg-primary/20 hover:text-primary rounded disabled:opacity-0 transition-all"
                >
                  <ChevronUp size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 'down')}
                  disabled={index === orderedTeams.length - 1 || isLoading}
                  className="p-1 hover:bg-primary/20 hover:text-primary rounded disabled:opacity-0 transition-all"
                >
                  <ChevronDown size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {error && <p className="text-xs text-destructive font-bold mb-3">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={isLoading}
        className={`w-full py-2.5 rounded-lg font-bold text-sm transition-colors border flex items-center justify-center gap-2 ${
          isFinalized
            ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
            : 'bg-secondary hover:bg-secondary/80 text-foreground border-border'
        }`}
      >
        {isLoading ? 'Sparar...' : isFinalized ? <><Lock size={16} /> Uppdatera Igen</> : 'Dela ut poäng & Fyll Träd'}
      </button>
    </div>
  );
}
