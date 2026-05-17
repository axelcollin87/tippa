'use client';

import { Star, ChevronUp, ChevronDown, Minus, Users } from 'lucide-react';
import Link from 'next/link';
import { toggleFavoriteLeague } from '@/app/leagues/actions';
import { useState } from 'react';

interface LeagueSummary {
  id: string;
  name: string;
  currentRank: number;
  previousRank: number | null;
  isFavorite: boolean;
  memberCount: number;
  groupName?: string | null;
}

interface ScoreboardProps {
  leagues: LeagueSummary[];
}

export default function Scoreboard({ leagues }: ScoreboardProps) {
  const [localLeagues, setLocalLeagues] = useState(leagues);

  const handleToggleFavorite = async (leagueId: string) => {
    // Optimistisk uppdatering
    setLocalLeagues(prev => prev.map(l => 
      l.id === leagueId ? { ...l, isFavorite: !l.isFavorite } : l
    ));
    
    try {
      await toggleFavoriteLeague(leagueId);
    } catch (error) {
      // Revertera om det skiter sig
      setLocalLeagues(leagues);
      console.error(error);
    }
  };

  // Sortera: Favoriter först, sen rank
  const sortedLeagues = [...localLeagues].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return a.currentRank - b.currentRank;
  });

  if (leagues.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight flex items-center gap-2">
          Scoreboard
        </h2>
        <Link href="/leagues" className="text-[10px] font-black text-primary uppercase hover:underline tracking-widest">
          Alla Ligor
        </Link>
      </div>

      <div className="grid gap-3">
        {sortedLeagues.map((league) => {
          const trend = !league.previousRank || league.currentRank === league.previousRank
            ? 'same'
            : league.currentRank < league.previousRank
              ? 'up'
              : 'down';

          const href = league.id === 'global' 
            ? '/leagues?global=true' 
            : league.groupName 
              ? `/bets?group=${league.groupName}`
              : `/leagues/${league.id}`;

          return (
            <div 
              key={league.id}
              className={`bg-card rounded-2xl border-2 transition-all flex items-center justify-between group overflow-hidden ${league.isFavorite ? 'border-primary/30 shadow-md' : 'border-border hover:border-primary/30 hover:shadow-lg'}`}
            >
              <div className="flex items-center gap-4 flex-1">
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggleFavorite(league.id);
                  }}
                  className={`transition-all hover:scale-110 p-4 pr-0 z-20 ${league.isFavorite ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30 hover:text-muted-foreground'}`}
                >
                  <Star size={20} />
                </button>
                
                <Link 
                  href={href} 
                  className="flex flex-col flex-1 py-4"
                >
                  <span className="font-bold text-sm md:text-base group-hover:text-primary transition-colors">
                    {league.name}
                  </span>
                  <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    <Users size={10} />
                    {league.memberCount} medlemmar
                  </div>
                </Link>
              </div>

              <Link 
                href={href}
                className="flex items-center gap-6 py-4 px-4 border-l border-border/10 hover:bg-primary/5 transition-colors"
              >
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1.5">
                    {trend === 'up' && <ChevronUp className="text-green-500" size={18} strokeWidth={3} />}
                    {trend === 'down' && <ChevronDown className="text-red-500" size={18} strokeWidth={3} />}
                    {trend === 'same' && <Minus className="text-muted-foreground/50" size={18} strokeWidth={3} />}
                    
                    <span className={`text-xl md:text-2xl font-black tracking-tighter ${trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-foreground'}`}>
                      #{league.currentRank}
                    </span>
                  </div>
                  <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest leading-none">
                    Din placering
                  </span>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
