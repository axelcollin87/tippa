'use client';

import { useOptimistic, useTransition } from 'react';
import { saveBet, saveProgressBet } from '@/app/bets/actions';
import TeamBadge from './TeamBadge';
import Countdown from './Countdown';
import { Lock } from 'lucide-react';
import { STAGE_TRANSLATIONS, getTeamInfo } from '@/lib/teams';

interface MatchCardProps {
  match: any;
  userBet: any;
}

export default function MatchCard({ match, userBet }: MatchCardProps) {
  const [isPending, startTransition] = useTransition();

  const [optimisticBet, setOptimisticBet] = useOptimistic(
    {
      predictedSign: userBet?.predictedSign,
      predictedWinner: userBet?.predictedWinner,
    },
    (state, { type, value }) => {
      if (type === 'sign') return { ...state, predictedSign: value };
      if (type === 'winner') return { ...state, predictedWinner: value };
      return state;
    }
  );

  const lockTime = new Date(match.kickoff.getTime() - 60 * 60 * 1000);
  const isLocked = new Date() > lockTime || match.isCompleted;

  const date = new Date(match.kickoff).toLocaleDateString('sv-SE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const time = new Date(match.kickoff).toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isCorrect = optimisticBet?.predictedSign === match.actualSign;
  const pointsEarned = userBet
    ? userBet.pointsAwarded + userBet.pointsAwardedProgress
    : 0;

  const resultColorClass = match.isCompleted
    ? isCorrect
      ? 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)] bg-green-500/5'
      : 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] bg-red-500/5'
    : isLocked
      ? 'border-border/50 opacity-80'
      : 'border-border hover:border-primary/50 shadow-md';

  async function handleSignAction(formData: FormData) {
    const sign = formData.get('predictedSign') as string;
    startTransition(async () => {
      setOptimisticBet({ type: 'sign', value: sign });
      try {
        await saveBet(formData);
      } catch (e) {
        console.error(e);
      }
    });
  }

  async function handleWinnerAction(formData: FormData) {
    const winner = formData.get('predictedWinner') as string;
    startTransition(async () => {
      setOptimisticBet({ type: 'winner', value: winner });
      try {
        await saveProgressBet(formData);
      } catch (e) {
        console.error(e);
      }
    });
  }

  return (
    <div
      className={`bg-card rounded-2xl border-2 transition-all ${resultColorClass} p-3 md:p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 relative overflow-hidden`}
    >
      {match.isCompleted && (
        <div
          className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-black uppercase tracking-widest ${isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
        >
          {isCorrect ? `VINST +${pointsEarned}P` : 'FÖRLUST 0P'}
        </div>
      )}

      <div className="flex-1 w-full">
        <div className="flex flex-col gap-1 items-start mb-2 md:mb-4">
          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 w-full justify-start">
            <span className="self-start text-[9px] md:text-[10px] font-black bg-secondary px-2 py-0.5 rounded text-muted-foreground uppercase tracking-tighter">
              {match.groupName
                ? `Grupp ${match.groupName}`
                : STAGE_TRANSLATIONS[match.stage] || match.stage}
            </span>
            <span className="text-[10px] md:text-xs text-foreground font-bold">
              {match.isCompleted ? 'AVSLUTAD' : `${date} kl ${time}`}
            </span>
          </div>
          {match.ground && !match.isCompleted && (
            <span className="text-[9px] md:text-[10px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1 mt-0.5 md:mt-1 opacity-70">
              <svg
                className="w-2.5 h-2.5 md:w-3 md:h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                ></path>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                ></path>
              </svg>
              {match.ground}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between w-full gap-2">
          <div className="flex-1 flex justify-start">
            <TeamBadge
              teamName={match.homeTeam}
              className="text-sm md:text-lg font-black"
            />
          </div>

          <div className="flex flex-col items-center">
            {match.isCompleted ? (
              <div className="flex items-center gap-2 md:gap-3 text-xl md:text-2xl font-black text-foreground px-3 md:px-4 py-0.5 md:py-1 bg-secondary/30 rounded-lg md:rounded-xl">
                <span>{match.homeScore}</span>
                <span className="text-muted-foreground opacity-30">-</span>
                <span>{match.awayScore}</span>
              </div>
            ) : (
              <span className="text-muted-foreground text-[9px] md:text-[10px] font-black uppercase opacity-30">
                VS
              </span>
            )}
          </div>

          <div className="flex-1 flex justify-end">
            <TeamBadge
              teamName={match.awayTeam}
              className="text-sm md:text-lg font-black"
              reversed
            />
          </div>
        </div>

        {!isLocked && !match.isCompleted && (
          <div className="mt-3 md:mt-4 hidden md:block">
            <Countdown targetDate={match.kickoff} />
          </div>
        )}
      </div>

      <div className="w-full md:w-auto flex flex-col items-center gap-3 md:gap-4">
        {!isLocked && !match.isCompleted && (
          <div className="md:hidden mb-0.5">
            <Countdown targetDate={match.kickoff} />
          </div>
        )}

        <div className="flex flex-col gap-3 md:gap-4 w-full">
          <div className="flex flex-col items-center gap-1">
            <div className="flex gap-1.5 md:gap-2 w-full md:w-auto">
              {['1', 'X', '2'].map((sign) => {
                const isSelected = optimisticBet.predictedSign === sign;
                const isActual = match.actualSign === sign;

                let btnClass = '';
                if (match.isCompleted) {
                  if (isSelected && isCorrect)
                    btnClass =
                      'bg-green-500 text-white border-green-600 shadow-lg';
                  else if (isSelected && !isCorrect)
                    btnClass =
                      'bg-red-500 text-white border-red-600 opacity-80';
                  else if (!isSelected && isActual)
                    btnClass =
                      'bg-green-500/20 text-green-600 border border-green-500/30';
                  else
                    btnClass =
                      'bg-secondary text-muted-foreground opacity-40 grayscale';
                } else {
                  btnClass = isSelected
                    ? 'bg-primary text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.4)] scale-105 md:scale-110 z-10'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:text-foreground border border-border';
                }

                return (
                  <form
                    key={sign}
                    action={handleSignAction}
                    className="flex-1 md:flex-none"
                  >
                    <input type="hidden" name="matchId" value={match.id} />
                    <input type="hidden" name="predictedSign" value={sign} />
                    <button
                      type="submit"
                      disabled={isLocked || isPending}
                      className={`w-full md:w-12 h-11 md:h-12 rounded-xl font-black text-xl md:text-2xl transition-all ${btnClass} ${isLocked && !match.isCompleted ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      {sign}
                    </button>
                  </form>
                );
              })}
            </div>
          </div>

          {!match.groupName && (
            <div className="flex flex-col items-center gap-1 border-t border-border pt-2 md:pt-3">
              <span className="text-[9px] md:text-[10px] font-black text-primary uppercase tracking-widest">
                Vem går vidare?
              </span>
              <div className="flex gap-1.5 md:gap-2 w-full">
                {[match.homeTeam, match.awayTeam].map((team) => {
                  const isSelected = optimisticBet.predictedWinner === team;
                  const isActualWinner = match.actualWinner === team;

                  let btnClass = '';
                  if (match.isCompleted) {
                    if (isSelected && isActualWinner)
                      btnClass = 'bg-primary text-primary-foreground shadow-lg';
                    else if (isSelected && !isActualWinner)
                      btnClass = 'bg-red-500 text-white opacity-80';
                    else if (!isSelected && isActualWinner)
                      btnClass =
                        'bg-primary/20 text-primary border border-primary/30';
                    else
                      btnClass =
                        'bg-secondary text-muted-foreground opacity-40';
                  } else {
                    btnClass = isSelected
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'bg-secondary text-muted-foreground border border-border';
                  }

                  return (
                    <form
                      key={team}
                      action={handleWinnerAction}
                      className="flex-1"
                    >
                      <input type="hidden" name="matchId" value={match.id} />
                      <input
                        type="hidden"
                        name="predictedWinner"
                        value={team}
                      />
                      <button
                        type="submit"
                        disabled={isLocked || isPending}
                        className={`w-full py-1.5 md:py-2 px-1 rounded-lg font-bold text-[9px] md:text-[10px] uppercase transition-all ${btnClass} ${isLocked && !match.isCompleted ? 'cursor-not-allowed opacity-50' : ''}`}
                      >
                        {getTeamInfo(team).name.substring(0, 12)}
                      </button>
                    </form>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {isLocked && !match.isCompleted && (
          <div className="flex flex-col items-center w-full mt-1 md:mt-2 gap-2">
            <div className="flex items-center gap-1 text-destructive text-[9px] md:text-[10px] font-black uppercase">
              <Lock size={10} /> Låst
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
