import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { saveBet } from './actions';
import Link from 'next/link';
import GroupRanking from '@/components/GroupRanking';
import Countdown from '@/components/Countdown';
import { Lock } from 'lucide-react';
import TeamBadge from '@/components/TeamBadge';

export default async function BetsPage(props: {
  searchParams: Promise<{ group?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const searchParams = await props.searchParams;

  const config = await prisma.globalConfig.findUnique({
    where: { id: 'global' },
  });
  const isGroupLocked = config?.groupStageLocked ?? false;

  const allMatches = await prisma.match.findMany({
    orderBy: { kickoff: 'asc' },
    include: {
      bets: { where: { userId: session.user.id } },
    },
  });

  const groupBets = await prisma.groupPlacementBet.findMany({
    where: { userId: session.user.id },
  });

  const groups: Record<string, Set<string>> = {};
  for (const match of allMatches) {
    if (match.groupName && match.groupName !== 'TBD') {
      if (!groups[match.groupName]) groups[match.groupName] = new Set();
      groups[match.groupName].add(match.homeTeam);
      groups[match.groupName].add(match.awayTeam);
    }
  }

  const groupNames = Object.keys(groups).sort();
  const activeGroup = searchParams.group || groupNames[0] || 'A';

  const activeMatches = allMatches.filter((m) => m.groupName === activeGroup);
  const activeTeams = Array.from(groups[activeGroup] || []);
  const activeUserRanks = groupBets.filter((b) => b.groupName === activeGroup);

  // Beräkna status för varje grupp för att färgkoda flikarna
  const groupStatus: Record<string, 'completed' | 'started' | 'empty'> = {};
  for (const g of groupNames) {
    const gMatches = allMatches.filter((m) => m.groupName === g);
    const gMatchBets = gMatches.filter((m) => m.bets.length > 0);
    const gPlacementBets = groupBets.filter((b) => b.groupName === g);

    const hasAllMatchBets =
      gMatches.length > 0 && gMatchBets.length === gMatches.length;
    const hasPlacementBet = gPlacementBets.length === 4;

    if (hasAllMatchBets && hasPlacementBet) {
      groupStatus[g] = 'completed';
    } else if (gMatchBets.length > 0 || gPlacementBets.length > 0) {
      groupStatus[g] = 'started';
    } else {
      groupStatus[g] = 'empty';
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
            Välj 1, X eller 2. Potten delas mellan alla som får rätt!
          </p>
        </div>

        {groupNames.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-2 mt-4">
            {groupNames.map((g) => {
              const status = groupStatus[g];
              let statusBorder = 'border-border';
              if (status === 'completed')
                statusBorder =
                  'border-primary shadow-[0_0_8px_rgba(var(--primary),0.3)]';
              else if (status === 'started')
                statusBorder =
                  'border-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.3)]';
              else
                statusBorder =
                  'border-destructive shadow-[0_0_8px_rgba(239,68,68,0.3)]';

              return (
                <Link
                  key={g}
                  href={`/bets?group=${g}`}
                  className={`px-4 py-2 rounded-full font-black text-[10px] md:text-xs transition-all uppercase tracking-tighter border-2 ${statusBorder} ${
                    activeGroup === g
                      ? 'bg-foreground text-background scale-105'
                      : 'bg-card text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  Grupp {g}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {activeTeams.length > 0 ? (
        <>
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-foreground uppercase tracking-widest">
                Tabell
              </h2>
              <span className="text-[10px] font-black bg-primary/20 text-primary px-2 py-1 rounded">
                5P PER RÄTT PLACERING
              </span>
            </div>

            {isGroupLocked && (
              <div className="bg-destructive/10 border-l-4 border-destructive p-4 flex items-center gap-3 rounded-r-lg">
                <Lock className="text-destructive" size={20} />
                <p className="text-destructive font-medium text-sm text-balance">
                  Gruppspelet har startat. Tabellen är låst.
                </p>
              </div>
            )}

            <GroupRanking
              groupName={activeGroup}
              teams={activeTeams}
              initialPlacements={activeUserRanks}
              isLocked={isGroupLocked}
            />
          </section>

          <section className="space-y-6 pt-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-foreground uppercase tracking-widest">
                Matcher
              </h2>
              <span className="text-[10px] font-black bg-secondary text-muted-foreground px-2 py-1 rounded">
                VARIERANDE "POTT-SYSTEM"
              </span>
            </div>

            <div className="grid gap-4">
              {activeMatches.map((match) => {
                const userBet = match.bets[0];
                const lockTime = new Date(
                  match.kickoff.getTime() - 60 * 60 * 1000
                );
                const isLocked = new Date() > lockTime;

                const date = new Date(match.kickoff).toLocaleDateString(
                  'sv-SE',
                  { weekday: 'short', day: 'numeric', month: 'short' }
                );
                const time = new Date(match.kickoff).toLocaleTimeString(
                  'sv-SE',
                  { hour: '2-digit', minute: '2-digit' }
                );

                return (
                  <div
                    key={match.id}
                    className={`bg-card rounded-2xl border transition-all ${
                      isLocked
                        ? 'border-border/50 opacity-80'
                        : 'border-border hover:border-primary/50 shadow-md'
                    } p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6`}
                  >
                    <div className="flex-1 w-full">
                      <div className="flex flex-col gap-1 items-start mb-4">
                        <div className="flex items-center gap-4 w-full justify-between md:justify-start">
                          <span className="text-[10px] font-black bg-secondary px-2 py-0.5 rounded text-muted-foreground uppercase tracking-tighter">
                            Grupp {match.groupName}
                          </span>
                          <span className="text-xs text-foreground font-bold">
                            {date} kl {time}
                          </span>
                        </div>
                        {match.ground && (
                          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1 mt-1 opacity-70">
                            <svg
                              className="w-3 h-3"
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

                      {/* TEAM DISPLAY - FORCED HORIZONTAL ON MOBILE */}
                      <div className="flex items-center justify-between w-full gap-2">
                        <div className="flex-1 flex justify-start">
                          <TeamBadge
                            teamName={match.homeTeam}
                            className="text-sm md:text-lg font-black"
                          />
                        </div>

                        <span className="text-muted-foreground text-[10px] font-black uppercase opacity-30">
                          VS
                        </span>

                        <div className="flex-1 flex justify-end">
                          <TeamBadge
                            teamName={match.awayTeam}
                            className="text-sm md:text-lg font-black"
                            reversed
                          />
                        </div>
                      </div>

                      {!isLocked && (
                        <div className="mt-4 hidden md:block">
                          <Countdown targetDate={match.kickoff} />
                        </div>
                      )}
                    </div>

                    <div className="w-full md:w-auto flex flex-col items-center gap-2">
                      {!isLocked && (
                        <div className="md:hidden mb-1">
                          <Countdown targetDate={match.kickoff} />
                        </div>
                      )}
                      <form
                        action={saveBet}
                        className="flex gap-2 w-full md:w-auto"
                      >
                        <input type="hidden" name="matchId" value={match.id} />

                        {['1', 'X', '2'].map((sign) => {
                          const isSelected = userBet?.predictedSign === sign;
                          return (
                            <button
                              key={sign}
                              type="submit"
                              name="predictedSign"
                              value={sign}
                              disabled={isLocked}
                              className={`flex-1 md:w-14 h-14 md:h-16 rounded-xl font-black text-xl md:text-2xl transition-all ${
                                isSelected
                                  ? 'bg-primary text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.4)] scale-105 md:scale-110 z-10'
                                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:text-foreground border border-border'
                              } ${isLocked ? 'cursor-not-allowed opacity-50' : ''}`}
                            >
                              {sign}
                            </button>
                          );
                        })}
                      </form>
                      {isLocked && (
                        <div className="flex items-center justify-between w-full md:justify-center md:gap-4 mt-2">
                          <div className="flex items-center gap-1 text-destructive text-[10px] font-black uppercase">
                            <Lock size={12} /> Låst
                          </div>
                          {match.actualSign && (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                                Resultat
                              </span>
                              <span className="text-xl font-black text-primary">
                                {match.actualSign}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      ) : (
        <div className="text-center py-20 text-muted-foreground border border-dashed border-border rounded-2xl">
          Inga grupper inlästa ännu. Gå till Admin-panelen och synka datan.
        </div>
      )}
    </div>
  );
}
