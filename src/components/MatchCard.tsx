'use client';

import { useOptimistic, useTransition } from 'react';
import { saveBet, saveProgressBet } from '@/app/bets/actions';
import TeamBadge from './TeamBadge';
import Countdown from './Countdown';
import { Lock, Loader2 } from 'lucide-react';
import { STAGE_TRANSLATIONS, getTeamInfo } from '@/lib/teams';
import { useToast } from './Toast';
import InfoPopover from './InfoPopover';

interface MatchCardProps {
  match: any;
  userBet: any;
  isCompact?: boolean;
}

export default function MatchCard({ match, userBet, isCompact = false }: MatchCardProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

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

  const isKnockout = !match.groupName;
  const hasSign = !!optimisticBet?.predictedSign;
  const hasWinner = !!optimisticBet?.predictedWinner;
  const isBetComplete = isKnockout ? (hasSign && hasWinner) : hasSign;
  const isBetStarted = hasSign || hasWinner;

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
      : !isBetComplete && isBetStarted
        ? 'border-amber-500/50 hover:border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.15)] bg-amber-500/[0.02]'
        : 'border-border hover:border-primary/50 shadow-md';

  async function handleSignAction(formData: FormData) {
    const sign = formData.get('predictedSign') as string;
    startTransition(async () => {
      setOptimisticBet({ type: 'sign', value: sign });
      try {
        await saveBet(formData);
        toast('Ditt tips har sparats!');
      } catch (e) {
        toast(e instanceof Error ? e.message : 'Kunde inte spara tipset.', 'error');
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
        toast('Ditt tips om avancemang har sparats!');
      } catch (e) {
        toast(e instanceof Error ? e.message : 'Kunde inte spara avancemang.', 'error');
        console.error(e);
      }
    });
  }

  return (
    <div
      className={`bg-card ${isCompact ? 'rounded-xl border' : 'rounded-2xl border-2'} transition-all ${resultColorClass} ${isCompact ? 'p-3' : 'p-3 md:p-4'} flex flex-col ${isCompact ? '' : 'md:flex-row md:items-center'} justify-between ${isCompact ? 'gap-3' : 'gap-4 md:gap-6'} relative overflow-hidden`}
    >
      {match.isCompleted && (
        <div
          className={`absolute top-0 right-0 ${isCompact ? '' : 'md:right-60'} px-3 py-1 text-[10px] font-black uppercase tracking-widest ${isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
        >
          {isCorrect ? `VINST +${pointsEarned}P` : 'FÖRLUST 0P'}
        </div>
      )}

      <div className="flex-1 w-full">
        <div className={`flex flex-col gap-1 items-start ${isCompact ? 'mb-2' : 'mb-2 md:mb-4'}`}>
          <div className={`flex flex-col ${isCompact ? '' : 'md:flex-row md:items-center md:gap-4'} gap-1 w-full justify-start`}>
            <span className="self-start text-[9px] md:text-[10px] font-black bg-secondary px-2 py-0.5 rounded text-muted-foreground uppercase tracking-tighter">
              {match.groupName
                ? `Grupp ${match.groupName}`
                : STAGE_TRANSLATIONS[match.stage] || match.stage}
            </span>
            <span className={`${isCompact ? 'text-[9px] sm:text-xs' : 'text-[10px] md:text-xs'} text-foreground font-bold flex items-center gap-2 flex-wrap`}>
              {match.isCompleted ? 'AVSLUTAD' : `${date} kl ${time}`}
              {!isLocked && !match.isCompleted && isCompact && (
                <Countdown targetDate={match.kickoff} hideLabel={false} variant="badge" />
              )}
              {!isLocked && !match.isCompleted && (
                isBetComplete ? (
                  <span className="inline-flex items-center gap-1 text-[9px] md:text-[10px] bg-green-500/10 text-green-500 font-black px-2 py-0.5 rounded border border-green-500/20 shrink-0">
                    KLAR
                  </span>
                ) : isBetStarted ? (
                  <span className="inline-flex items-center gap-1 text-[9px] md:text-[10px] bg-amber-500/10 text-amber-500 font-black px-2 py-0.5 rounded border border-amber-500/20 shrink-0 animate-pulse">
                    EJ KLAR <span className="hidden sm:inline">{isKnockout && (!hasSign ? '(SAKNAR 1X2)' : '(SAKNAR AVANCEMANG)')}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[9px] md:text-[10px] bg-red-500/10 text-destructive font-black px-2 py-0.5 rounded border border-red-500/20 shrink-0">
                    OTIPPAD
                  </span>
                )
              )}
              {isPending && (
                <span className="inline-flex items-center gap-1 text-[9px] md:text-[10px] text-primary font-black animate-pulse bg-primary/10 px-2 py-0.5 rounded border border-primary/20 shrink-0">
                  <Loader2 className="w-2.5 h-2.5 animate-spin text-primary" /> Sparar...
                </span>
              )}
            </span>
          </div>
          {match.ground && !match.isCompleted && !isCompact && (
            <span className="text-[9px] md:text-[10px] text-muted-foreground font-medium uppercase tracking-wider hidden sm:flex items-center gap-1 mt-0.5 md:mt-1 opacity-70">
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
              className={`${isCompact ? 'text-[11px] sm:text-xs' : 'text-sm md:text-lg'} font-black`}
            />
          </div>

          <div className="flex flex-col items-center">
            {match.isCompleted ? (
              <div className={`flex items-center gap-1.5 sm:gap-3 ${isCompact ? 'text-xs sm:text-md px-2 py-0.5 rounded-lg' : 'text-xl md:text-2xl px-3 md:px-4 py-0.5 md:py-1 rounded-lg md:rounded-xl'} font-black text-foreground bg-secondary/30`}>
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
              className={`${isCompact ? 'text-[11px] sm:text-xs' : 'text-sm md:text-lg'} font-black`}
              reversed
            />
          </div>
        </div>

        {!isLocked && !match.isCompleted && !isCompact && (
          <div className="mt-3 md:mt-4 hidden md:block">
            <Countdown targetDate={match.kickoff} />
          </div>
        )}
      </div>

      <div className={`w-full ${isCompact ? '' : 'md:w-auto'} flex flex-col items-center gap-1.5 sm:gap-3`}>
        {!isLocked && !match.isCompleted && !isCompact && (
          <div className="md:hidden mb-0.5">
            <Countdown targetDate={match.kickoff} />
          </div>
        )}

        <div className={`flex flex-col ${isCompact ? 'gap-2' : 'gap-3 md:gap-4'} w-full`}>
          <div className="flex flex-col items-center gap-1">
            {isKnockout && (
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">
                Full tid (90 min)
              </span>
            )}
            <div className={`flex gap-1.5 ${isCompact ? '' : 'md:gap-2'} w-full ${isCompact ? '' : 'md:w-auto'}`}>
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
                    className={`flex-1 ${isCompact ? '' : 'md:flex-none'}`}
                  >
                    <input type="hidden" name="matchId" value={match.id} />
                    <input type="hidden" name="predictedSign" value={sign} />
                    <button
                      type="submit"
                      disabled={isLocked || isPending}
                      className={`w-full ${isCompact ? 'h-9 text-sm rounded-lg' : 'md:w-12 h-11 md:h-12 text-xl md:text-2xl rounded-xl'} font-black transition-all ${btnClass} ${isLocked && !match.isCompleted ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      {sign}
                    </button>
                  </form>
                );
              })}
            </div>
          </div>

          {isKnockout && (
            <div className={`flex flex-col items-center gap-1 border-t border-border ${isCompact ? 'pt-1.5' : 'pt-2 md:pt-3'}`}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[9px] font-black text-primary uppercase tracking-widest">
                  Vem går vidare?
                </span>
                <InfoPopover title="Slutspelsregler">
                  <p>
                    I slutspelet måste du tippa <strong>båda</strong> valen för att ditt tips ska vara fullständigt:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-xs">
                    <li><strong>Full tid (1X2):</strong> Gäller efter 90 minuter (ordinarie tid). Om du tror matchen går till förlängning tippar du <strong>X</strong>.</li>
                    <li><strong>Avancemang:</strong> Välj det lag som går vidare till nästa runda (efter ev. förlängning och straffar).</li>
                  </ul>
                  <p className="mt-2 text-[11px] border-t border-border pt-2 leading-relaxed">
                    💡 <strong>Tippa &quot;mot&quot; ditt resultat:</strong> Du kan tippa t.ex. <strong>1</strong> efter full tid, men att <strong>bortalaget</strong> ändå går vidare. Detta är helt tillåtet och kan vara en bra strategisk gardering!
                  </p>
                </InfoPopover>
              </div>
              <div className="flex gap-1.5 w-full">
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
                      className="flex-1 min-w-0"
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
                        className={`w-full ${isCompact ? 'py-1.5 px-1 text-[10px]' : 'py-2 px-2 text-xs'} rounded-lg font-black uppercase tracking-wider transition-all truncate ${btnClass} ${isLocked && !match.isCompleted ? 'cursor-not-allowed opacity-50' : ''}`}
                        title={getTeamInfo(team).name}
                      >
                        <span className="truncate block w-full">
                          {getTeamInfo(team).name}
                        </span>
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
