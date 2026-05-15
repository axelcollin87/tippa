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

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const [allMatchesWithBets, userBets, userLeagues, allUsers] =
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

  // Skapa en fiktiv "Global" liga som alltid visas
  const globalLeague = {
    id: 'global',
    name: 'Globala Tabellen',
    inviteCode: 'GLOBAL',
    adminId: 'system',
    _count: { members: allUsers.length },
    comments: [],
    isGlobal: true,
    createdAt: new Date(),
  };

  const displayLeagues: ((typeof userLeagues)[0] & { isGlobal?: boolean })[] = [
    globalLeague,
    ...userLeagues,
  ];
  const now = new Date();

  // Beräkna global ranking
  const currentUser = allUsers.find((u) => u.id === session.user.id);
  const globalRank = allUsers.findIndex((u) => u.id === session.user.id) + 1;
  const totalPoints = currentUser?.totalScore || 0;

  const upcomingMatches = allMatchesWithBets
    .filter(
      (m) =>
        new Date(m.kickoff.getTime() - 60 * 60 * 1000) > now && !m.isCompleted
    )
    .slice(0, 3);

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

      let progressPotential = { home: 0, away: 0 };
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

  const missingBetsCount = allMatchesWithBets.filter(
    (m) =>
      !userBets.some((b) => b.matchId === m.id) &&
      !m.isCompleted &&
      new Date(m.kickoff) > now
  ).length;

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 space-y-10 max-w-6xl mx-auto">
      <DashboardTour />

      {/* HERO SECTION */}
      <div
        id="tour-welcome"
        className="relative bg-card rounded-[2.5rem] border border-border overflow-hidden shadow-2xl"
      >
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -ml-20 -mb-20 pointer-events-none"></div>

        <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex-1 space-y-4 text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-black text-foreground tracking-tighter leading-none">
              HEJ, {session.user.name?.split(' ')[0].toUpperCase()}! 👋
            </h1>
            <p className="text-muted-foreground text-lg font-medium max-w-md">
              Välkommen tillbaka till Tippwits. Just nu ligger du på plats{' '}
              <b>#{globalRank}</b> i den globala ligan.
            </p>

            {missingBetsCount > 0 ? (
              <div className="inline-flex items-center gap-2 bg-destructive/10 text-destructive px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest animate-pulse">
                <AlertCircle size={14} />
                {missingBetsCount} otippade matcher kvar!
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest">
                <Zap size={14} />
                Alla tips är inne, snyggt jobbat!
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
            <div className="bg-secondary/50 backdrop-blur-sm p-6 rounded-3xl border border-border/50 text-center flex flex-col items-center justify-center min-w-[140px]">
              <Trophy className="text-yellow-500 mb-2" size={24} />
              <span className="text-3xl font-black text-foreground">
                {totalPoints}
              </span>
              <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                Poäng
              </span>
            </div>
            <div className="bg-secondary/50 backdrop-blur-sm p-6 rounded-3xl border border-border/50 text-center flex flex-col items-center justify-center min-w-[140px]">
              <Zap className="text-primary mb-2" size={24} />
              <span className="text-3xl font-black text-foreground">
                #{globalRank}
              </span>
              <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                Global Rank
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* LEFT & CENTER: MATCHES */}
        <div className="lg:col-span-2 space-y-10">
          {/* LIVE MATCHES */}
          {activeMatchesWithData.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-ping"></div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-green-500">
                  Live Just Nu
                </h2>
              </div>
              <div className="grid gap-4">
                {activeMatchesWithData.map((match) => (
                  <LiveMatchCard key={match.id} matchData={match} />
                ))}
              </div>
            </div>
          )}

          {/* UPCOMING MATCHES */}
          <div id="tour-upcoming" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="text-primary" size={28} />
                <h2 className="text-2xl font-black uppercase tracking-tight">
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
                className="text-xs font-black text-primary uppercase hover:underline tracking-widest"
              >
                Visa alla &rarr;
              </Link>
            </div>

            <div className="grid gap-3">
              {upcomingMatches.length > 0 ? (
                upcomingMatches.map((match) => {
                  const myBet = userBets.find((b) => b.matchId === match.id);
                  return (
                    <div
                      key={match.id}
                      className="bg-card border border-border rounded-3xl p-5 flex items-center justify-between group hover:border-primary/50 transition-all hover:shadow-lg"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black bg-secondary px-2 py-0.5 rounded text-muted-foreground uppercase tracking-widest">
                            {match.groupName
                              ? `Grupp ${match.groupName}`
                              : match.stage}
                          </span>
                          <Countdown targetDate={match.kickoff} />
                        </div>
                        <div className="text-xl font-black text-foreground flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                          <TeamBadge
                            teamName={match.homeTeam}
                            className="text-lg"
                          />
                          <span className="text-muted-foreground text-xs font-medium uppercase opacity-30 hidden sm:inline">
                            vs
                          </span>
                          <TeamBadge
                            teamName={match.awayTeam}
                            className="text-lg"
                          />
                        </div>
                      </div>

                      <div className="text-right">
                        {myBet ? (
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                              Ditt Tips
                            </span>
                            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black text-xl shadow-lg shadow-primary/20">
                              {myBet.predictedSign}
                            </div>
                          </div>
                        ) : (
                          <Link
                            href={`/bets`}
                            className="bg-destructive text-destructive-foreground px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform"
                          >
                            Tippa
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="bg-secondary/20 border border-dashed border-border rounded-[2rem] p-12 text-center text-muted-foreground font-medium italic">
                  Inga kommande matcher just nu.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: LEAGUES & SOCIAL */}
        <div className="space-y-10">
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <Users className="text-primary" size={28} />
                <h2 className="text-2xl font-black uppercase tracking-tight">
                  Mina Ligor
                </h2>
              </div>
              <Link
                href="/leagues"
                className="text-xs font-black text-primary uppercase hover:underline tracking-widest"
              >
                Hantera &rarr;
              </Link>
            </div>

            <div className="grid gap-4">
              {displayLeagues.length > 0 ? (
                displayLeagues.map((league) => (
                  <Link
                    key={league.id}
                    href={`/leagues/${league.id}`}
                    className={`bg-card border ${league.isGlobal ? 'border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.1)]' : 'border-border'} rounded-[2rem] p-6 hover:border-primary/50 transition-all hover:shadow-xl group relative overflow-hidden`}
                  >
                    <div className="relative z-10 space-y-4">
                      <div className="flex justify-between items-start">
                        <h3 className="text-xl font-black uppercase tracking-tight group-hover:text-primary transition-colors flex items-center gap-2">
                          {league.isGlobal && (
                            <span className="text-primary text-2xl">🌍</span>
                          )}
                          {league.name}
                        </h3>
                        <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-1 rounded uppercase">
                          {league._count.members} pers
                        </span>
                      </div>

                      {!league.isGlobal && league.comments[0] && (
                        <div className="bg-secondary/30 p-3 rounded-2xl flex items-start gap-3">
                          <MessageSquare
                            size={14}
                            className="text-muted-foreground mt-1 shrink-0"
                          />
                          <div className="text-xs italic line-clamp-2">
                            <span className="font-bold not-italic text-foreground">
                              {league.comments[0].user.name}:{' '}
                            </span>
                            "{league.comments[0].content}"
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.2em] pt-2">
                        {league.isGlobal
                          ? 'Se Världsrankingen'
                          : 'Gå till rummet'}{' '}
                        <ArrowRight size={14} />
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="bg-card border border-dashed border-border rounded-[2rem] p-8 text-center space-y-4">
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                    Du är inte med i några ligor än. Det är mycket roligare att
                    tippa tillsammans!
                  </p>
                  <Link
                    href="/leagues"
                    className="inline-block bg-secondary text-foreground px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-secondary/80 transition-colors"
                  >
                    Skapa eller Gå med
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
