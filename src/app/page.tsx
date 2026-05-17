import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  AlertCircle,
  Calendar,
  ArrowRight,
  Trophy,
  Users,
  Zap,
  MessageSquare,
} from 'lucide-react';
import Countdown from '@/components/Countdown';
import TeamBadge from '@/components/TeamBadge';
import LiveMatchCard from '@/components/LiveMatchCard';
import InfoPopover from '@/components/InfoPopover';
import DashboardTour from '@/components/DashboardTour';
import { getPotentialWinningsForSign } from '@/lib/scoring';

import Scoreboard from '@/components/Scoreboard';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const [allMatchesWithBets, userBets, userLeaguesWithDetails, allUsers] =
    await Promise.all([
      prisma.match.findMany({
        orderBy: { kickoff: 'asc' },
        include: {
          bets: {
            include: {
              user: {
                select: { name: true },
              },
            },
          },
        },
      }),
      prisma.matchBet.findMany({
        where: { userId: session.user.id },
      }),
      prisma.league.findMany({
        where: {
          members: { some: { userId: session.user.id } },
        },
        include: {
          members: {
            include: {
              user: { select: { id: true, totalScore: true } },
            },
          },
          _count: { select: { members: true } },
          comments: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { name: true } } },
          },
        },
      }),
      prisma.user.findMany({
        orderBy: { totalScore: 'desc' },
        select: { id: true, totalScore: true },
      }),
    ]);

  const now = new Date();

  // Beräkna global ranking
  const currentUserData = allUsers.find((u) => u.id === session.user.id);
  const globalRank = allUsers.findIndex((u) => u.id === session.user.id) + 1;
  const totalPoints = currentUserData?.totalScore || 0;

  // Formatera data för Scoreboard
  const scoreboardLeagues = userLeaguesWithDetails.map((league) => {
    const myMembership = league.members.find(
      (m) => m.userId === session.user.id
    );

    // Beräkna nuvarande rank i denna ligan
    const sortedMembers = [...league.members].sort(
      (a, b) => b.user.totalScore - a.user.totalScore
    );
    const currentRank =
      sortedMembers.findIndex((m) => m.userId === session.user.id) + 1;

    return {
      id: league.id,
      name: league.name,
      currentRank,
      previousRank: myMembership?.previousRank ?? null,
      isFavorite: myMembership?.isFavorite ?? false,
      memberCount: league._count.members,
      groupName: league.name.startsWith('Grupp ')
        ? league.name.split(' ')[1]
        : null,
    };
  });

  // Lägg till globala ligan i scoreboard
  scoreboardLeagues.unshift({
    id: 'global',
    name: 'Globala Tabellen',
    currentRank: globalRank,
    previousRank: null,
    isFavorite: false,
    memberCount: allUsers.length,
    groupName: null,
  });

  const upcomingMatches = allMatchesWithBets
    .filter(
      (m) =>
        new Date(m.kickoff.getTime() - 60 * 60 * 1000) > now && !m.isCompleted
    )
    .slice(0, 4);

  const activeMatches = allMatchesWithBets.filter(
    (m) => new Date(m.kickoff) <= now && !m.isCompleted
  );

  const activeMatchesWithData = await Promise.all(
    activeMatches.map(async (match) => {
      const myBet = userBets.find((b) => b.matchId === match.id);
      const potentialWinnings = {
        '1': await getPotentialWinningsForSign(match.id, '1'),
        'X': await getPotentialWinningsForSign(match.id, 'X'),
        '2': await getPotentialWinningsForSign(match.id, '2'),
      };

      const progressPotential = { home: 0, away: 0 };
      if (!match.groupName) {
        progressPotential.home = await getPotentialWinningsForSign(
          match.id,
          '1'
        );
        progressPotential.away = await getPotentialWinningsForSign(
          match.id,
          '2'
        );
      }

      return { ...match, myBet, potentialWinnings, progressPotential };
    })
  );

  const anyGroupMatchesLeft = allMatchesWithBets.some(
    (m) => m.groupName && !m.isCompleted
  );

  const missingBetsCount = allMatchesWithBets.filter((m) => {
    const isMissing = !userBets.some((b) => b.matchId === m.id);
    const lockTime = new Date(m.kickoff.getTime() - 60 * 60 * 1000);
    const isBettable = lockTime > now;
    const isNotCompleted = !m.isCompleted;

    if (!isMissing || !isBettable || !isNotCompleted) return false;

    // Om det finns gruppspelsmatcher kvar som inte är klara, räkna bara dem
    if (anyGroupMatchesLeft) {
      return !!m.groupName;
    }

    // Om gruppspelet är helt klart, räkna bara nästa relevanta slutspelsrunda
    // (för att inte visa 16 matcher när man bara kan veta lagen i nästa steg)
    const firstUpcomingKnockout = allMatchesWithBets
      .filter((km) => !km.groupName && !km.isCompleted)
      .sort((a, b) => a.kickoff.getTime() - b.kickoff.getTime())[0];

    if (firstUpcomingKnockout) {
      if (
        firstUpcomingKnockout.stage === '3rd Place' ||
        firstUpcomingKnockout.stage === 'Final'
      ) {
        return m.stage === '3rd Place' || m.stage === 'Final';
      }
      return m.stage === firstUpcomingKnockout.stage;
    }

    return true;
  }).length;

  return (
    <div className="py-4 px-3 sm:py-6 sm:px-6 lg:px-8 space-y-6 sm:space-y-10 max-w-6xl mx-auto">
      <DashboardTour />

      {/* HERO SECTION */}
      <div
        id="tour-welcome"
        className="relative bg-card rounded-2xl sm:rounded-[2.5rem] border border-border overflow-hidden shadow-2xl"
      >
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -ml-20 -mb-20 pointer-events-none"></div>

        <div className="relative z-10 p-4 md:p-8 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-10">
          <div className="flex-1 space-y-2 md:space-y-4 text-center md:text-left">
            <h1 className="text-xl md:text-5xl font-black text-foreground tracking-tighter leading-none">
              HEJ, {session.user.name?.split(' ')[0].toUpperCase()}! 👋
            </h1>
            <p className="text-foreground/90 text-xs md:text-base font-medium max-w-md mx-auto md:mx-0">
              Välkommen tillbaka till Tippwits. Just nu ligger du på plats{' '}
              <b className="text-primary">#{globalRank}</b> i den globala ligan.
            </p>

            {missingBetsCount > 0 ? (
              <Link
                href="/bets"
                className="text-[10px] font-black uppercase hover:underline tracking-widest"
              >
                <div className="inline-flex items-center gap-1.5 bg-destructive text-destructive-foreground px-3 py-1.5 rounded-full font-black text-[9px] md:text-[10px] uppercase tracking-widest animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                  <AlertCircle size={12} />
                  {missingBetsCount} otippade kvar!
                </div>
              </Link>
            ) : (
              <div className="inline-flex items-center gap-1.5 bg-primary/20 text-primary px-3 py-1.5 rounded-full font-black text-[9px] md:text-[10px] uppercase tracking-widest border border-primary/30">
                <Zap size={12} />
                Alla tips är inne!
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 w-full md:w-auto">
            <div className="bg-secondary/50 backdrop-blur-sm p-3 md:p-6 rounded-xl md:rounded-3xl border border-border/50 text-center flex flex-col items-center justify-center min-w-[100px] md:min-w-[140px]">
              <Trophy className="text-yellow-500 mb-0.5 md:mb-2 w-4 h-4 md:w-5 md:h-5" />
              <span className="text-xl md:text-3xl font-black text-foreground">
                {totalPoints}
              </span>
              <span className="text-[8px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                Poäng
              </span>
            </div>
            <div className="bg-secondary/50 backdrop-blur-sm p-3 md:p-6 rounded-xl md:rounded-3xl border border-border/50 text-center flex flex-col items-center justify-center min-w-[100px] md:min-w-[140px]">
              <Zap className="text-primary mb-0.5 md:mb-2 w-4 h-4 md:w-5 md:h-5" />
              <span className="text-xl md:text-3xl font-black text-foreground">
                #{globalRank}
              </span>
              <span className="text-[8px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                Global Rank
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
        {/* LEFT & CENTER: MATCHES */}
        <div className="lg:col-span-2 space-y-8 md:space-y-10">
          {/* LIVE MATCHES */}
          {activeMatchesWithData.length > 0 && (
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></div>
                <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-green-500">
                  Live Just Nu
                </h2>
              </div>
              <div className="grid gap-3 md:gap-4">
                {activeMatchesWithData.map((match) => (
                  <LiveMatchCard key={match.id} matchData={match} />
                ))}
              </div>
            </div>
          )}

          {/* UPCOMING MATCHES */}
          <div id="tour-upcoming" className="space-y-4 md:space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3">
                <Calendar className="text-primary w-6 h-6 md:w-7 md:h-7" />
                <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">
                  Kommande
                </h2>
                <InfoPopover title="Matcher">
                  <p>
                    Här ser du de tre närmaste matcherna. Tippa senast 1 timme
                    innan avspark!
                  </p>
                </InfoPopover>
              </div>
              <Link
                href="/bets"
                className="text-[10px] font-black text-primary uppercase hover:underline tracking-widest"
              >
                Till mina tips &rarr;
              </Link>
            </div>

            <div className="grid gap-2 md:gap-3">
              {upcomingMatches.length > 0 ? (
                upcomingMatches.map((match) => {
                  const myBet = userBets.find((b) => b.matchId === match.id);
                  const href = `/bets?${match.groupName ? `group=${match.groupName}` : 'view=knockout'}#match-${match.id}`;

                  return (
                    <Link
                      key={match.id}
                      href={href}
                      className="bg-card border border-border rounded-2xl md:rounded-3xl p-4 md:p-5 flex items-center justify-between group hover:border-primary/50 transition-all hover:shadow-lg"
                    >
                      <div className="space-y-2 md:space-y-3">
                        <div className="flex items-center gap-2 md:gap-3">
                          <span className="text-[9px] md:text-[10px] font-black bg-secondary px-2 py-0.5 rounded text-muted-foreground uppercase tracking-widest">
                            {match.groupName
                              ? `Grupp ${match.groupName}`
                              : match.stage}
                          </span>
                          <Countdown targetDate={match.kickoff} />
                        </div>
                        <div className="text-lg md:text-xl font-black text-foreground flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6">
                          <TeamBadge
                            teamName={match.homeTeam}
                            className="text-md md:text-lg"
                          />
                          <span className="text-muted-foreground text-[10px] font-medium uppercase opacity-30 hidden sm:inline">
                            vs
                          </span>
                          <TeamBadge
                            teamName={match.awayTeam}
                            className="text-md md:text-lg"
                          />
                        </div>
                      </div>

                      <div className="text-right">
                        {myBet ? (
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[9px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                              Tips
                            </span>
                            <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black text-lg md:text-xl shadow-lg shadow-primary/20">
                              {myBet.predictedSign}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-destructive text-destructive-foreground px-5 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl font-black text-[10px] uppercase tracking-widest group-hover:scale-105 transition-transform">
                            Tippa
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="bg-secondary/20 border border-dashed border-border rounded-2xl md:rounded-[2rem] p-8 md:p-12 text-center text-muted-foreground font-medium italic">
                  Inga kommande matcher just nu.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: LEAGUES & SOCIAL */}
        <div className="space-y-8 md:space-y-10">
          <Scoreboard leagues={scoreboardLeagues} />

          <div className="space-y-4 md:space-y-6">
            <div className="flex items-center justify-between px-2 pt-4 border-t border-border/50">
              <div className="flex items-center gap-2 md:gap-3">
                <Users className="text-primary w-6 h-6 md:w-7 md:h-7" />
                <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">
                  Ligadetaljer
                </h2>
              </div>
            </div>

            <div className="grid gap-3 md:gap-4">
              {userLeaguesWithDetails.length > 0 ? (
                userLeaguesWithDetails.map((league) => (
                  <Link
                    key={league.id}
                    href={`/leagues/${league.id}`}
                    className="bg-card border border-border rounded-2xl md:rounded-[2rem] p-4 md:p-6 hover:border-primary/50 transition-all group"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <h3 className="text-sm font-black uppercase tracking-tight group-hover:text-primary transition-colors">
                          {league.name}
                        </h3>
                        <span className="text-[9px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded uppercase">
                          {league._count.members} pers
                        </span>
                      </div>

                      {league.comments[0] && (
                        <div className="bg-secondary/30 p-2 md:p-3 rounded-xl md:rounded-2xl flex items-start gap-2 md:gap-3">
                          <MessageSquare className="text-muted-foreground mt-1 shrink-0 w-3 h-3" />
                          <div className="text-[10px] md:text-[11px] italic line-clamp-1">
                            <span className="font-bold not-italic text-foreground">
                              {league.comments[0].user.name}:{' '}
                            </span>
                            &quot;{league.comments[0].content}&quot;
                          </div>
                        </div>
                      )}
                    </div>
                  </Link>
                ))
              ) : (
                <div className="bg-card border border-dashed border-border rounded-2xl md:rounded-[2rem] p-6 md:p-8 text-center">
                  <p className="text-xs text-muted-foreground font-medium italic">
                    Gå med i en liga för att se detaljer här.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
