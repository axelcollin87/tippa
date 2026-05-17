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
import MatchCard from '@/components/MatchCard';
import CrystalBallQuestion from './CrystalBallQuestion';

export default async function BetsPage(props: {
  searchParams: Promise<{ group?: string; view?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const searchParams = await props.searchParams;
  const view = searchParams.view || 'group'; // 'group', 'knockout', 'crystalball'
  const isKnockoutView = view === 'knockout';
  const isCrystalBallView = view === 'crystalball';

  const [
    allMatches,
    groupBets,
    officialStandings,
    crystalQuestions,
    crystalBets,
  ] = await Promise.all([
    prisma.match.findMany({
      orderBy: { kickoff: 'asc' },
      include: {
        bets: { where: { userId: session.user.id } },
      },
    }),
    prisma.groupPlacementBet.findMany({
      where: { userId: session.user.id },
    }),
    prisma.officialGroupStanding.findMany(),
    prisma.sidebetQuestion.findMany({ orderBy: { points: 'desc' } }),
    prisma.userSidebet.findMany({ where: { userId: session.user.id } }),
  ]);

  const groupLockTimes: Record<string, Date> = {};
  for (const match of allMatches) {
    if (match.groupName && !groupLockTimes[match.groupName]) {
      groupLockTimes[match.groupName] = new Date(
        match.kickoff.getTime() - 60 * 60 * 1000
      );
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
  const activeGroup =
    isKnockoutView || isCrystalBallView
      ? null
      : searchParams.group || groupNames[0] || 'A';

  // Kontrollera om hela gruppspelet är färdigspelat
  const groupMatchesForLock = allMatches.filter(
    (m) => m.groupName && m.groupName !== 'TBD'
  );
  const isGroupStageFinished =
    groupMatchesForLock.length > 0 &&
    groupMatchesForLock.every((m) => m.isCompleted);

  const activeMatches = isKnockoutView
    ? knockoutMatches
    : allMatches.filter((m) => m.groupName === activeGroup);
  const activeTeams = activeGroup ? Array.from(groups[activeGroup] || []) : [];
  const activeUserRanks = activeGroup
    ? groupBets.filter((b) => b.groupName === activeGroup)
    : [];
  const activeOfficialStandings = activeGroup
    ? officialStandings
        .filter((s) => s.groupName === activeGroup)
        .sort((a, b) => a.rank - b.rank)
    : [];

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

  // Gruppera slutspelsmatcher efter runda om vi är i slutspelsvyn
  const knockoutStages: Record<string, typeof knockoutMatches> = {};
  if (isKnockoutView) {
    for (const match of knockoutMatches) {
      if (!knockoutStages[match.stage]) knockoutStages[match.stage] = [];
      knockoutStages[match.stage].push(match);
    }
  }

  return (
    <div className="py-6 px-3 sm:py-10 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-3 border-b border-border pb-4 md:pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight uppercase">
            Mina Tips
          </h1>
          <p className="text-muted-foreground mt-1 text-[11px] md:text-sm">
            Klicka på en den grupp du vill tippa eller se resultat för.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 md:gap-2 pb-2 mt-2 md:mt-4 items-center">
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
                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full font-black text-[9px] md:text-xs transition-all uppercase tracking-tighter border-2 ${statusBorder} ${
                  activeGroup === g && !isCrystalBallView
                    ? 'bg-primary/80 text-background scale-105 border-primary shadow-[0_0_15px_rgba(var(--primary),0.4)]'
                    : 'bg-card text-muted-foreground hover:bg-secondary'
                }`}
              >
                Grupp {g}
              </Link>
            );
          })}

          <div className="w-px h-6 bg-border mx-1 md:mx-2"></div>

          {knockoutMatches.length > 0 && (
            <Link
              href={`/bets?view=knockout`}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full font-black text-[9px] md:text-xs transition-all uppercase tracking-tighter border-2 ${
                isKnockoutView
                  ? 'bg-primary/80 text-background scale-105 border-primary shadow-[0_0_15px_rgba(var(--primary),0.4)]'
                  : 'bg-card text-muted-foreground hover:bg-secondary border-border'
              }`}
            >
              SLUTSPEL
            </Link>
          )}

          <Link
            href={`/bets?view=crystalball`}
            className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full font-black text-[9px] md:text-xs transition-all uppercase tracking-tighter border-2 ${
              isCrystalBallView
                ? 'bg-[url("https://www.transparenttextures.com/patterns/stardust.png")] bg-purple-500/20 text-purple-400 scale-105 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                : 'bg-card text-muted-foreground hover:bg-secondary border-border'
            }`}
          >
            🔮
          </Link>
        </div>
      </div>

      {isCrystalBallView ? (
        <section className="space-y-4 md:space-y-6">
          <div>
            <h1 className="text-2xl md:text-4xl font-black text-purple-400 uppercase tracking-widest flex items-center gap-3">
              <span>🔮</span> KRISTALLKULAN
            </h1>
            <p className="text-muted-foreground mt-2 text-xs md:text-sm max-w-2xl">
              Långtidsspel som avgörs efter att hela turneringen är spelad.
              Måste tippas innan VM startar!
            </p>
          </div>

          {crystalQuestions.length > 0 ? (
            <div className="grid gap-3 md:gap-4 md:grid-cols-2">
              {crystalQuestions.map((q) => {
                const bet = crystalBets.find((b) => b.questionId === q.id);
                return (
                  <CrystalBallQuestion key={q.id} question={q} userBet={bet} />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 md:py-20 text-muted-foreground border border-dashed border-border rounded-xl md:rounded-2xl">
              Kristallkulan är inte aktiverad ännu.
            </div>
          )}
        </section>
      ) : !isKnockoutView && activeTeams.length > 0 ? (
        <>
          <section className="space-y-4 md:space-y-6">
            <div className="">
              <div>
                <h1 className="text-2xl md:text-4xl font-black text-primary uppercase tracking-widest">
                  Grupp {activeGroup}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-black text-foreground uppercase tracking-widest">
                  Tabell
                </h2>
                <span className="text-[7px] md:text-[8px] font-black bg-primary/20 text-primary px-2 py-1 rounded">
                  50P PER RÄTT
                </span>
                <InfoPopover title="Grupptippning">
                  <p>
                    Du får <b>50 poäng</b> för varje lag du sätter på exakt rätt
                    position (1:a till 4:e plats) i gruppen efter att sista
                    gruppspelsmatchen är spelad.
                  </p>
                </InfoPopover>
                {activeGroup && groupLockTimes[activeGroup] && (
                  <div className="ml-2 md:ml-4 flex items-center gap-2">
                    {new Date() < groupLockTimes[activeGroup] ? (
                      <Countdown
                        targetDate={groupLockTimes[activeGroup]}
                        label="låses"
                      />
                    ) : (
                      <span className="text-destructive flex items-center gap-1 text-[10px] md:text-xs font-bold uppercase">
                        <Lock size={10} /> Låst
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <GroupRanking
              groupName={activeGroup || 'A'}
              teams={activeTeams}
              initialPlacements={activeUserRanks}
              isLocked={
                activeGroup ? new Date() > groupLockTimes[activeGroup] : false
              }
              officialStandings={activeOfficialStandings}
            />
          </section>

          <section className="space-y-4 md:space-y-6 pt-2 md:pt-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg md:text-xl font-black text-foreground uppercase tracking-widest">
                Matcher
              </h2>
              <span className="text-[9px] md:text-[10px] font-black bg-secondary text-muted-foreground px-2 py-1 rounded">
                BELÖNAR SKRÄLLAR
              </span>
            </div>
            <div className="grid gap-3 md:gap-4">
              {activeMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  userBet={match.bets[0]}
                />
              ))}
            </div>
          </section>
        </>
      ) : isKnockoutView ? (
        <section className="space-y-4 md:space-y-6">
          <div className="">
            <div>
              <h1 className="text-2xl md:text-4xl font-black text-primary uppercase tracking-widest">
                SLUTSPEL
              </h1>
            </div>
          </div>

          {!isGroupStageFinished ? (
            <div className="text-center py-10 md:py-20 text-muted-foreground border border-dashed border-border rounded-xl md:rounded-2xl flex flex-col items-center gap-3">
              <Lock className="text-muted-foreground opacity-50 w-6 h-6 md:w-8 md:h-8" />
              <p className="font-bold text-sm">
                Denna del öppnar när hela gruppspelet är avslutat.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:gap-4">
              {Object.keys(knockoutStages).map((stage) => (
                <div
                  key={stage}
                  className="space-y-3 md:space-y-4 mb-6 md:mb-8"
                >
                  <h3 className="text-xl md:text-2xl font-black text-foreground border-b border-border pb-1 md:pb-2 uppercase">
                    {STAGE_TRANSLATIONS[stage] || stage}
                  </h3>
                  {knockoutStages[stage].map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      userBet={match.bets[0]}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        <div className="text-center py-10 md:py-20 text-muted-foreground border border-dashed border-border rounded-xl md:rounded-2xl">
          Inga grupper inlästa ännu.
        </div>
      )}
    </div>
  );
}
