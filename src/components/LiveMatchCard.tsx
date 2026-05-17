"use client";

import { useState } from 'react';
import Link from 'next/link';
import TeamBadge from '@/components/TeamBadge';
import InfoPopover from '@/components/InfoPopover';
import { ChevronDown, Users } from 'lucide-react';

// Define a more specific type for the props
type MatchData = {
  id: string;
  stage: string;
  groupName: string | null;
  ground: string | null;
  homeTeam: string;
  awayTeam: string;
  kickoff: Date;
  bets: {
    predictedSign: string;
    predictedWinner: string | null;
    user: { name: string | null };
  }[];
  myBet: { predictedSign: string; predictedWinner: string | null } | undefined;
  potentialWinnings: { '1': number; 'X': number; '2': number; };
  progressPotential: { home: number; away: number; };
};

interface LiveMatchCardProps {
  matchData: MatchData;
}

export default function LiveMatchCard({ matchData }: LiveMatchCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const betsFor1 = matchData.bets.filter(b => b.predictedSign === '1');
  const betsForX = matchData.bets.filter(b => b.predictedSign === 'X');
  const betsFor2 = matchData.bets.filter(b => b.predictedSign === '2');

  const betsForHome = matchData.bets.filter(b => b.predictedWinner === matchData.homeTeam);
  const betsForAway = matchData.bets.filter(b => b.predictedWinner === matchData.awayTeam);

  return (
    <div className="bg-card border border-green-500/50 rounded-xl shadow-lg shadow-green-500/10 overflow-hidden relative">
      {/* Main Card Content (Clickable) */}
      <Link 
        href={`/bets?${matchData.groupName ? `group=${matchData.groupName}` : 'view=knockout'}#match-${matchData.id}`}
        className="p-2 md:p-3 flex items-center justify-between group hover:bg-green-500/5 transition-colors"
      >
        <div className="space-y-1 flex-1">
          <div className="flex flex-col gap-1 items-start">
            <div className="flex items-center gap-2">
              <span className="text-[9px] md:text-[10px] font-black bg-secondary px-2 py-0.5 rounded text-muted-foreground uppercase">
                {matchData.stage === 'Group' ? `Grupp ${matchData.groupName}` : matchData.stage}
              </span>
              <span className="text-[10px] md:text-xs font-bold text-green-500 uppercase animate-pulse">LIVE</span>
            </div>
          </div>
          <div className="text-md md:text-lg font-bold text-foreground mt-1 md:mt-2 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
            <TeamBadge teamName={matchData.homeTeam} className="text-sm md:text-base" />
            <span className="text-muted-foreground font-normal text-[10px] uppercase hidden sm:inline">vs</span>
            <TeamBadge teamName={matchData.awayTeam} className="text-sm md:text-base" />
          </div>
        </div>

        <div className="text-right relative z-10">
          <div className="flex items-center justify-end gap-1 mb-1">
            <div className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase">Ditt tips</div>
            <div onClick={(e) => e.preventDefault()}>
              <InfoPopover title="Live Poäng (1X2)">
                <p>Visar hur många poäng ditt lagda tips kommer generera om matchen slutar just nu.</p>
              </InfoPopover>
            </div>
          </div>
          {matchData.myBet ? (
            <div className="flex flex-col items-end gap-1 md:gap-2">
              <div className="flex flex-col items-end gap-1">
                <div className="flex gap-1 justify-end">
                  {['1', 'X', '2'].map((sign) => (
                    <div key={sign} className={`w-6 h-6 md:w-7 md:h-7 rounded md:rounded-md flex items-center justify-center font-black text-[10px] md:text-xs transition-all ${matchData.myBet?.predictedSign === sign ? 'bg-primary text-primary-foreground shadow-[0_0_10px_rgba(var(--primary),0.4)]' : 'bg-secondary text-secondary-foreground/30 border border-border/50'}`}>
                      {sign}
                    </div>
                  ))}
                </div>
                <span className="text-[9px] md:text-[10px] font-bold text-green-500 uppercase">
                  1X2: +{matchData.potentialWinnings[matchData.myBet.predictedSign as '1'|'X'|'2']} P
                </span>
              </div>
              
              {matchData.stage !== 'Group' && matchData.myBet.predictedWinner && (
                <div className="flex flex-col items-end gap-0.5 md:gap-1 border-t border-border pt-1">
                  <div className="text-[8px] md:text-[10px] font-black text-primary px-1.5 md:px-2 bg-primary/10 rounded">
                    {matchData.myBet.predictedWinner.toUpperCase()} VIDARE
                  </div>
                  <span className="text-[9px] md:text-[10px] font-bold text-primary uppercase">
                    POT: +{matchData.myBet.predictedWinner === matchData.homeTeam ? matchData.progressPotential.home : matchData.progressPotential.away} P
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="inline-block text-[9px] md:text-[10px] font-bold text-destructive uppercase italic bg-destructive/10 px-2 py-1 rounded border border-destructive/20 transition-colors">
              Tippa nu
            </div>
          )}
        </div>
      </Link>

      {/* Expansion Section */}
      <div className="border-t border-green-500/20 px-2 md:px-3 py-1.5 md:py-2 bg-secondary/20 relative z-20">
        <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex justify-between items-center text-[10px] md:text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
          <span>{isExpanded ? 'Dölj' : 'Visa'} tippfördelning</span>
          <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isExpanded && (
        <div className="p-3 md:p-4 bg-secondary/30 border-t border-green-500/20 space-y-4 md:space-y-6">
          <div className="grid grid-cols-3 gap-2 md:gap-4 text-center">
            {/* Column 1 */}
            <div>
              <h4 className="font-black text-xl md:text-2xl text-foreground">1</h4>
              <div className="flex flex-col items-center gap-0.5 md:gap-1 text-muted-foreground text-[9px] md:text-[10px] mt-1">
                <div className="flex items-center gap-1">
                  <Users size={10} className="w-2.5 h-2.5 md:w-3 md:h-3" />
                  <span>{betsFor1.length} st</span>
                </div>
                <span className="font-bold text-green-500">({matchData.potentialWinnings['1']}p)</span>
              </div>
            </div>
            {/* Column X */}
            <div>
              <h4 className="font-black text-xl md:text-2xl text-foreground">X</h4>
              <div className="flex flex-col items-center gap-0.5 md:gap-1 text-muted-foreground text-[9px] md:text-[10px] mt-1">
                <div className="flex items-center gap-1">
                  <Users size={10} className="w-2.5 h-2.5 md:w-3 md:h-3" />
                  <span>{betsForX.length} st</span>
                </div>
                <span className="font-bold text-green-500">({matchData.potentialWinnings['X']}p)</span>
              </div>
            </div>
            {/* Column 2 */}
            <div>
              <h4 className="font-black text-xl md:text-2xl text-foreground">2</h4>
              <div className="flex flex-col items-center gap-0.5 md:gap-1 text-muted-foreground text-[9px] md:text-[10px] mt-1">
                <div className="flex items-center gap-1">
                  <Users size={10} className="w-2.5 h-2.5 md:w-3 md:h-3" />
                  <span>{betsFor2.length} st</span>
                </div>
                <span className="font-bold text-green-500">({matchData.potentialWinnings['2']}p)</span>
              </div>
            </div>
          </div>

          {matchData.stage !== 'Group' && (
             <div className="pt-3 md:pt-4 border-t border-border">
                <h5 className="text-[9px] md:text-[10px] font-black text-center uppercase tracking-[0.2em] mb-2 md:mb-4 text-primary">Avancemang</h5>
                <div className="grid grid-cols-2 gap-4 md:gap-8">
                  <div className="text-center">
                    <p className="text-[10px] md:text-xs font-black truncate">{matchData.homeTeam}</p>
                    <div className="flex flex-col items-center gap-0.5 md:gap-1 mt-1">
                      <span className="text-[9px] md:text-[10px] text-muted-foreground">{betsForHome.length} pers</span>
                      <span className="text-[9px] md:text-[10px] font-bold text-primary">{matchData.progressPotential.home}p</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] md:text-xs font-black truncate">{matchData.awayTeam}</p>
                    <div className="flex flex-col items-center gap-0.5 md:gap-1 mt-1">
                      <span className="text-[9px] md:text-[10px] text-muted-foreground">{betsForAway.length} pers</span>
                      <span className="text-[9px] md:text-[10px] font-bold text-primary">{matchData.progressPotential.away}p</span>
                    </div>
                  </div>
                </div>
             </div>
          )}
        </div>
      )}
    </div>
  );
}
