import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { saveBet, saveProgressBet } from './actions';
import Link from 'next/link';
import GroupRanking from '@/components/GroupRanking';
import Countdown from '@/components/Countdown';
import InfoPopover from '@/components/InfoPopover';
import { Lock, Info } from 'lucide-react';
import { STAGE_TRANSLATIONS } from '@/lib/teams';
import TeamBadge from '@/components/TeamBadge';



export default async function BetsPage(props: {
  searchParams: Promise<{ group?: string; view?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const searchParams = await props.searchParams;
  const isKnockoutView = searchParams.view === 'knockout';

  const [allMatches, groupBets] = await Promise.all([
    prisma.match.findMany({
      orderBy: { kickoff: 'asc' },
      include: {
        bets: { where: { userId: session.user.id } },
      },
    }),
    prisma.groupPlacementBet.findMany({
      where: { userId: session.user.id },
    })
  ]);
  
  const groupLockTimes: Record<string, Date> = {};
  for (const match of allMatches) {
    if (match.groupName && !groupLockTimes[match.groupName]) {
      groupLockTimes[match.groupName] = new Date(match.kickoff.getTime() - 60 * 60 * 1000);
    }
  }

  const groups: Record<string, Set<string>> = {};
  const knockoutMatches = [];
  
  for (const match of allMatches) {
    if (match.groupName && match.groupName !== 'TBD') {
      if (!groups[match.groupName]) groups[match.groupName] = new Set();
      groups[match.groupName].add(match.homeTeam);
      groups[match.groupName].add(match.awayTeam);
    } else if (!match.groupName) {
      knockoutMatches.push(match);
    }
  }

  const groupNames = Object.keys(groups).sort();
  const activeGroup = isKnockoutView ? null : (searchParams.group || groupNames[0] || 'A');

  const activeMatches = isKnockoutView ? knockoutMatches : allMatches.filter((m) => m.groupName === activeGroup);
  const activeTeams = activeGroup ? Array.from(groups[activeGroup] || []) : [];
  const activeUserRanks = activeGroup ? groupBets.filter((b) => b.groupName === activeGroup) : [];

  const groupStatus: Record<string, 'completed' | 'started' | 'empty'> = {};
  for (const g of groupNames) {
    const gMatches = allMatches.filter((m) => m.groupName === g);
    const gMatchBets = gMatches.filter((m) => m.bets.length > 0);
    const gPlacementBets = groupBets.filter((b) => b.groupName === g);

    const hasAllMatchBets = gMatches.length > 0 && gMatchBets.length === gMatches.length;
    const hasPlacementBet = gPlacementBets.length === 4;

    if (hasAllMatchBets && hasPlacementBet) {
      groupStatus[g] = 'completed';
    } else if (gMatchBets.length > 0 || gPlacementBets.length > 0) {
      groupStatus[g] = 'started';
    } else {
      groupStatus[g] = 'empty';
    }
  }

  // Gruppera slutspelsmatcher efter runda om vi är i slutspelsvyn
  const knockoutStages: Record<string, typeof knockoutMatches> = {};
  if (isKnockoutView) {
    for (const match of knockoutMatches) {
      if (!knockoutStages[match.stage]) knockoutStages[match.stage] = [];
      knockoutStages[match.stage].push(match);
    }
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight uppercase">
            Mina Tips
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Välj 1, X eller 2. Rätt tecken ger poäng relativt till hur många som
            tippat detta resultat. Klicka på grupperna för att sätta dina tips.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 pb-2 mt-4">
          {groupNames.map((g) => {
            const status = groupStatus[g];
            let statusBorder = 'border-border';
            if (status === 'completed') statusBorder = 'border-primary shadow-[0_0_8px_rgba(var(--primary),0.3)]';
            else if (status === 'started') statusBorder = 'border-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.3)]';
            else statusBorder = 'border-destructive shadow-[0_0_8px_rgba(239,68,68,0.3)]';

            return (
              <Link
                key={g}
                href={`/bets?group=${g}`}
                className={`px-4 py-2 rounded-full font-black text-[10px] md:text-xs transition-all uppercase tracking-tighter border-2 ${statusBorder} ${
                  activeGroup === g
                    ? 'bg-primary/80 text-background scale-105'
                    : 'bg-card text-muted-foreground hover:bg-secondary'
                }`}
              >
                Grupp {g}
              </Link>
            );
          })}
          
          {knockoutMatches.length > 0 && (
            <Link
              href={`/bets?view=knockout`}
              className={`px-4 py-2 rounded-full font-black text-[10px] md:text-xs transition-all uppercase tracking-tighter border-2 ${
                isKnockoutView
                  ? 'bg-primary/80 text-background scale-105 border-primary shadow-[0_0_8px_rgba(var(--primary),0.3)]'
                  : 'bg-card text-muted-foreground hover:bg-secondary border-border'
              }`}
            >
              SLUTSPEL
            </Link>
          )}
        </div>
      </div>

      {!isKnockoutView && activeTeams.length > 0 ? (
        <>
          <section className="space-y-6">
            <div className="">
              <div>
                <h1 className="text-4xl font-black text-primary uppercase tracking-widest">
                  Grupp {activeGroup}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-foreground uppercase tracking-widest">
                  Tabell
                </h2>
                <span className="text-[10px] font-black bg-primary/20 text-primary px-2 py-1 rounded">
                  50P PER RÄTT PLACERING
                </span>
                <InfoPopover title="Grupptippning">
                  <p>Du får <b>50 poäng</b> för varje lag du sätter på exakt rätt position (1:a till 4:e plats) i gruppen efter att sista gruppspelsmatchen är spelad.</p>
                  <p className="mt-2">Tips: Denna tabell är helt frikopplad från de enskilda matchresultaten du tippar nedan.</p>
                </InfoPopover>
                {activeGroup && groupLockTimes[activeGroup] && (
                  <div className="ml-4 flex items-center gap-2">
                    {new Date() < groupLockTimes[activeGroup] ? (
                      <Countdown targetDate={groupLockTimes[activeGroup]} label="låses om" />
                    ) : (
                      <span className="text-destructive flex items-center gap-1 text-xs font-bold uppercase">
                        <Lock size={12} /> Låst
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <GroupRanking
              groupName={activeGroup!}
              teams={activeTeams}
              initialPlacements={activeUserRanks}
              isLocked={activeGroup ? new Date() > groupLockTimes[activeGroup] : false}
            />
          </section>

          <section className="space-y-6 pt-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-foreground uppercase tracking-widest">
                Matcher
              </h2>
              <span className="text-[10px] font-black bg-secondary text-muted-foreground px-2 py-1 rounded">
                INVERSE POPULARITY
              </span>
              <InfoPopover title="Hur poängen räknas ut">
                <p>Vi använder ett system som belönar skrällar. Ju färre användare som tippat på samma resultat som du, desto mer poäng får du när du har rätt!</p>
                <p className="mt-2 text-primary font-bold">Poäng = 100 - (Procent som tippat samma)</p>
                <p className="mt-2 text-xs italic">I slutspelet multipliceras poängen: x2 i åttondelsfinal, x3 i kvarten, etc.</p>
              </InfoPopover>
            </div>
            <div className="grid gap-4">
              {activeMatches.map((match) => renderMatch(match, match.bets[0]))}
            </div>
          </section>
        </>
      ) : isKnockoutView ? (
        <section className="space-y-6">
            <div className="">
              <div>
                <h1 className="text-4xl font-black text-primary uppercase tracking-widest">
                  SLUTSPEL
                </h1>
              </div>
            </div>

            <div className="grid gap-4">
              {Object.keys(knockoutStages).map(stage => (
                  <div key={stage} className="space-y-4 mb-8">
                    <h3 className="text-2xl font-black text-foreground border-b border-border pb-2 uppercase">{STAGE_TRANSLATIONS[stage] || stage}</h3>
                    {knockoutStages[stage].map(match => renderMatch(match, match.bets[0]))}
                  </div>
              ))}
            </div>
        </section>
      ) : (
        <div className="text-center py-20 text-muted-foreground border border-dashed border-border rounded-2xl">
          Inga grupper inlästa ännu. Gå till Admin-panelen och synka datan.
        </div>
      )}
    </div>
  );

  // HJÄLPLOGIK FÖR ATT RENDERA EN MATCHKORT (DÅ DEN ANVÄNDS BÅDE FÖR GRUPP OCH SLUTSPEL)
  function renderMatch(match: any, userBet: any) {
    const lockTime = new Date(match.kickoff.getTime() - 60 * 60 * 1000);
    const isLocked = new Date() > lockTime;

    const date = new Date(match.kickoff).toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' });
    const time = new Date(match.kickoff).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });

    const isCorrect = userBet?.predictedSign === match.actualSign;
    const resultColorClass = match.isCompleted 
      ? (isCorrect ? 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]')
      : (isLocked ? 'border-border/50 opacity-80' : 'border-border hover:border-primary/50 shadow-md');

    return (
      <div key={match.id} className={`bg-card rounded-2xl border-2 transition-all ${resultColorClass} p-3 md:p-3 flex flex-col md:flex-row md:items-center justify-between gap-6`}>
        <div className="flex-1 w-full">
          <div className="flex flex-col gap-1 items-start mb-4">
            <div className="flex items-center gap-4 w-full justify-between md:justify-start">
              <span className="text-[10px] font-black bg-secondary px-2 py-0.5 rounded text-muted-foreground uppercase tracking-tighter">
                {match.groupName ? `Grupp ${match.groupName}` : (STAGE_TRANSLATIONS[match.stage] || match.stage)}
              </span>
              <span className="text-xs text-foreground font-bold">
                {date} kl {time}
              </span>
            </div>
            {match.ground && (
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1 mt-1 opacity-70">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                {match.ground}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between w-full gap-2">
            <div className="flex-1 flex justify-start">
              <TeamBadge teamName={match.homeTeam} className="text-sm md:text-lg font-black" />
            </div>
            <span className="text-muted-foreground text-[10px] font-black uppercase opacity-30">VS</span>
            <div className="flex-1 flex justify-end">
              <TeamBadge teamName={match.awayTeam} className="text-sm md:text-lg font-black" reversed />
            </div>
          </div>

          {!isLocked && (
            <div className="mt-4 hidden md:block">
              <Countdown targetDate={match.kickoff} />
            </div>
          )}
        </div>

        <div className="w-full md:w-auto flex flex-col items-center gap-4">
          {!isLocked && (
            <div className="md:hidden mb-1">
              <Countdown targetDate={match.kickoff} />
            </div>
          )}
          
          <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Resultat (1X2)</span>
              <form action={saveBet} className="flex gap-2 w-full md:w-auto">
                <input type="hidden" name="matchId" value={match.id} />
                {['1', 'X', '2'].map((sign) => {
                  const isSelected = userBet?.predictedSign === sign;
                  return (
                    <button
                      key={sign} type="submit" name="predictedSign" value={sign} disabled={isLocked}
                      className={`flex-1 md:w-12 h-12 md:h-12 rounded-xl font-black text-xl md:text-2xl transition-all ${isSelected ? 'bg-primary text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.4)] scale-105 md:scale-110 z-10' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:text-foreground border border-border'} ${isLocked ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      {sign}
                    </button>
                  );
                })}
              </form>
            </div>

            {!match.groupName && (
              <div className="flex flex-col items-center gap-1 border-t border-border pt-3">
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">Vem går vidare?</span>
                <div className="flex gap-2 w-full">
                  {[match.homeTeam, match.awayTeam].map((team) => {
                    const isSelected = userBet?.predictedWinner === team;
                    return (
                      <form key={team} action={saveProgressBet} className="flex-1">
                        <input type="hidden" name="matchId" value={match.id} />
                        <button
                          type="submit" name="predictedWinner" value={team} disabled={isLocked}
                          className={`w-full py-2 px-1 rounded-lg font-bold text-[10px] uppercase transition-all ${isSelected ? 'bg-primary text-primary-foreground shadow-lg' : 'bg-secondary text-muted-foreground border border-border'} ${isLocked ? 'cursor-not-allowed opacity-50' : ''}`}
                        >
                          {team}
                        </button>
                      </form>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {isLocked && (
            <div className="flex flex-col items-center w-full mt-2 gap-2">
              <div className="flex items-center gap-1 text-destructive text-[10px] font-black uppercase">
                <Lock size={12} /> Låst
              </div>
              <div className="flex gap-4">
                {match.actualSign && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">1X2:</span>
                    <span className="text-sm font-black text-primary">{match.actualSign}</span>
                  </div>
                )}
                {match.actualWinner && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Vinnare:</span>
                    <span className="text-sm font-black text-primary">{match.actualWinner}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}


