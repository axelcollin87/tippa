'use client';

import { useState, useEffect } from 'react';
import { saveGroupPlacement } from '@/app/bets/actions';
import TeamBadge from './TeamBadge';
import { ChevronUp, ChevronDown, Save, Lock, Trophy } from 'lucide-react';
import { getTeamInfo } from '@/lib/teams';
import { useToast } from './Toast';

interface Props {
  groupName: string;
  teams: string[]; // Standard laglista (bokstavsordning eller liknande)
  initialPlacements: any[];
  isLocked: boolean;
  officialStandings?: any[]; // Ny: Officiella resultat från admin
}

export default function GroupRanking({
  groupName,
  teams,
  initialPlacements,
  isLocked,
  officialStandings = [],
}: Props) {
  const [placements, setPlacements] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string[]>([]);
  const { toast } = useToast();

  const isFinalized = officialStandings.length === 4;

  useEffect(() => {
    // Om vi har exakt 4 sparade tips, använd dem
    if (initialPlacements && initialPlacements.length === 4) {
      const sorted = [...initialPlacements]
        .sort((a, b) => a.predictedRank - b.predictedRank)
        .map((p) => p.teamName);
      setPlacements(sorted);
      setLastSaved(sorted);
    } else {
      // Om inga tips (eller ogiltigt antal), använd standardlistan
      // Se till att vi bara har unika lag för att undvika render-buggar
      const uniqueTeams = Array.from(new Set(teams));
      setPlacements(uniqueTeams);
      setLastSaved([]);
    }
  }, [initialPlacements, teams]);

  const move = (index: number, direction: 'up' | 'down') => {
    if (isLocked || isFinalized) return;
    const newPlacements = [...placements];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newPlacements.length) return;

    const temp = newPlacements[index];
    newPlacements[index] = newPlacements[targetIndex];
    newPlacements[targetIndex] = temp;

    setPlacements(newPlacements);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveGroupPlacement(groupName, placements);
      setLastSaved(placements);
      toast(`Dina placeringstips för Grupp ${groupName} har sparats!`);
    } catch (error) {
      console.error(error);
      toast(error instanceof Error ? error.message : 'Kunde inte spara placeringar', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = JSON.stringify(placements) !== JSON.stringify(lastSaved);

  return (
    <div className={`space-y-4 p-6 rounded-[2rem] border-2 transition-all ${isFinalized ? 'bg-primary/5 border-primary/30 shadow-lg' : 'bg-card border-border'}`}>
      {isFinalized && (
        <div className="flex items-center justify-between border-b border-primary/20 pb-4 mb-2">
          <div className="flex items-center gap-2 text-primary">
            <Trophy size={18} />
            <span className="font-black uppercase text-xs tracking-widest">Gruppen är avgjord</span>
          </div>
          <span className="bg-primary text-primary-foreground text-[10px] font-black px-2 py-0.5 rounded uppercase">
            Poäng utdelade
          </span>
        </div>
      )}

      <div className="grid gap-3">
        {placements.map((teamName, index) => {
          const rank = index + 1;
          const officialTeamAtRank = officialStandings.find(s => s.rank === rank)?.teamName;
          const isCorrect = isFinalized && teamName === officialTeamAtRank;
          
          let statusClass = 'border-border bg-secondary/20';
          if (isFinalized) {
            statusClass = isCorrect 
              ? 'border-green-500/50 bg-green-500/10' 
              : 'border-red-500/30 bg-red-500/5 opacity-70';
          }

          return (
            <div
              key={teamName}
              className={`flex items-center justify-between p-3 rounded-2xl border-2 transition-all ${statusClass}`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${
                    isFinalized 
                      ? (isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white')
                      : (rank <= 2 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground')
                  }`}
                >
                  {rank}
                </div>
                <div className="flex flex-col">
                  <TeamBadge teamName={teamName} className="text-sm font-bold" />
                  {isFinalized && !isCorrect && officialTeamAtRank && (
                    <span className="text-[9px] font-medium text-muted-foreground italic">
                      Rätt: {getTeamInfo(officialTeamAtRank).name.substring(0, 12)}
                    </span>
                  )}
                </div>
              </div>

              {isFinalized ? (
                <div className="flex items-center gap-2">
                  {isCorrect && (
                    <span className="text-[10px] font-black text-green-500 bg-green-500/20 px-2 py-1 rounded uppercase tracking-wider">
                      +100P
                    </span>
                  )}
                </div>
              ) : !isLocked && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => move(index, 'up')}
                    disabled={index === 0}
                    className="p-2 hover:bg-primary/20 rounded-xl disabled:opacity-0 transition-all text-primary"
                    title="Flytta upp"
                  >
                    <ChevronUp size={24} />
                  </button>
                  <button
                    onClick={() => move(index, 'down')}
                    disabled={index === placements.length - 1}
                    className="p-2 hover:bg-primary/20 rounded-xl disabled:opacity-0 transition-all text-primary"
                    title="Flytta ner"
                  >
                    <ChevronDown size={24} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!isLocked && !isFinalized && (
        <button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
            hasChanges
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.02]'
              : 'bg-secondary text-muted-foreground cursor-not-allowed opacity-50'
          }`}
        >
          {isSaving ? (
            'Sparar...'
          ) : (
            <>
              <Save size={18} /> {lastSaved.length > 0 ? 'Uppdatera Tips' : 'Spara Tips'}
            </>
          )}
        </button>
      )}

      {isLocked && !isFinalized && (
        <div className="flex items-center justify-center gap-2 text-destructive font-black text-[10px] uppercase tracking-widest pt-2">
          <Lock size={12} /> Tippning låst
        </div>
      )}
    </div>
  );
}
