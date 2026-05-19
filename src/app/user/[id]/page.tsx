import { getServerSession } from 'next-auth';
import { authOptions } from '../../api/auth/[...nextauth]/route';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  User as UserIcon,
  Trophy,
  Calendar,
  CheckCircle2,
  XCircle,
  ArrowLeft,
} from 'lucide-react';
import TeamBadge from '@/components/TeamBadge';
import BackButton from '@/components/BackButton';

export default async function UserProfilePage(props: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  const params = await props.params;
  const userId = params.id;

  // 1. Fetch user and their basic stats
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      totalScore: true,
      createdAt: true,
    },
  });

  if (!user) {
    notFound();
  }

  // Calculate Global Rank
  const activeUsersWhereClause = {
    OR: [
      { matchBets: { some: {} } },
      { groupPlacements: { some: {} } },
      { UserSidebet: { some: {} } },
    ],
  };

  const allActiveUsers = await prisma.user.findMany({
    where: activeUsersWhereClause,
    orderBy: { totalScore: 'desc' },
    select: { id: true },
  });

  const globalRank = allActiveUsers.findIndex((u) => u.id === user.id) + 1;
  const rankDisplay = globalRank > 0 ? `#${globalRank}` : 'Ej rankad';

  // 2. Determine Time Constraints
  const now = new Date();

  // A match is locked 1 hour before kickoff
  const matchLockTime = new Date(now.getTime() + 60 * 60 * 1000);

  // Group placements are locked when the first match starts
  const firstMatch = await prisma.match.findFirst({
    orderBy: { kickoff: 'asc' },
  });
  const tournamentStarted = firstMatch
    ? now >= new Date(firstMatch.kickoff)
    : false;

  // 3. Fetch Locked Bets

  // Locked Match Bets
  const lockedMatchBets = await prisma.matchBet.findMany({
    where: {
      userId: user.id,
      match: {
        kickoff: { lte: matchLockTime }, // Only fetch bets for matches that are locked
      },
    },
    include: {
      match: true,
    },
    orderBy: {
      match: { kickoff: 'desc' },
    },
  });

  // Locked Sidebets
  const lockedSidebets = await prisma.userSidebet.findMany({
    where: {
      userId: user.id,
      question: {
        lockedAt: { lte: now }, // Only fetch bets for questions that are locked
      },
    },
    include: {
      question: true,
    },
  });

  // Locked Group Placements
  let lockedGroupBets: any[] = [];
  if (tournamentStarted) {
    lockedGroupBets = await prisma.groupPlacementBet.findMany({
      where: { userId: user.id },
      orderBy: [{ groupName: 'asc' }, { predictedRank: 'asc' }],
    });
  }

  const isMe = session.user.id === user.id;

  return (
    <div className="py-4 px-3 sm:py-8 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
      {/* HEADER / NAVIGATION */}
      <div className="flex items-center gap-4">
        <BackButton />
      </div>

      {/* USER PROFILE CARD */}
      <div className="bg-card border border-border rounded-2xl md:rounded-[2.5rem] p-6 md:p-12 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
          <div className="w-24 h-24 md:w-32 md:h-32 bg-secondary rounded-full flex items-center justify-center text-muted-foreground border-4 border-card shadow-lg shrink-0">
            <UserIcon size={48} className="md:w-16 md:h-16" />
          </div>

          <div className="text-center md:text-left flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tighter uppercase line-clamp-1">
                {user.name}
              </h1>
              {isMe && (
                <span className="text-[10px] font-black bg-primary/20 text-primary px-3 py-1 rounded-full uppercase tracking-widest">
                  Du
                </span>
              )}
            </div>
            <p className="text-muted-foreground font-medium text-sm md:text-base">
              Medlem sedan{' '}
              {user.createdAt.toLocaleDateString('sv-SE', {
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <div className="flex-1 md:flex-none bg-secondary/50 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-border/50 text-center min-w-[120px]">
              <Trophy className="text-yellow-500 w-5 h-5 mx-auto mb-2" />
              <div className="text-2xl md:text-3xl font-black text-foreground">
                {user.totalScore}
              </div>
              <div className="text-[9px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                Poäng
              </div>
            </div>
            <div className="flex-1 md:flex-none bg-secondary/50 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-border/50 text-center min-w-[120px]">
              <span className="text-xl md:text-2xl mb-1 block">🌍</span>
              <div className="text-2xl md:text-3xl font-black text-primary">
                {rankDisplay}
              </div>
              <div className="text-[9px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                Global Rank
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: MATCH BETS */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <Calendar className="text-primary w-6 h-6" />
            <h2 className="text-2xl font-black uppercase tracking-tight">
              Tippade Matcher
            </h2>
            <span className="text-xs font-black bg-secondary text-muted-foreground px-2 py-1 rounded ml-auto">
              Endast låsta matcher visas
            </span>
          </div>

          {lockedMatchBets.length > 0 ? (
            <div className="grid gap-4">
              {lockedMatchBets.map((bet) => {
                const isCompleted = bet.match.isCompleted;
                const isCorrectSign =
                  isCompleted && bet.predictedSign === bet.match.actualSign;
                const earnedPoints =
                  bet.pointsAwarded + bet.pointsAwardedProgress;

                return (
                  <div
                    key={bet.id}
                    className="bg-card border border-border rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    <div className="space-y-2">
                      <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        {bet.match.stage}
                        {isCompleted && isCorrectSign && (
                          <span className="text-green-500 flex items-center gap-1">
                            <CheckCircle2 size={12} /> Rätt
                          </span>
                        )}
                        {isCompleted && !isCorrectSign && (
                          <span className="text-red-500 flex items-center gap-1">
                            <XCircle size={12} /> Fel
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 md:gap-6 text-lg md:text-xl font-black">
                        <TeamBadge teamName={bet.match.homeTeam} />
                        <span className="text-muted-foreground text-sm opacity-50 font-medium">
                          {isCompleted
                            ? `${bet.match.homeScore} - ${bet.match.awayScore}`
                            : 'vs'}
                        </span>
                        <TeamBadge teamName={bet.match.awayTeam} />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 sm:justify-end border-t sm:border-t-0 border-border/50 pt-4 sm:pt-0 mt-2 sm:mt-0">
                      <div className="text-center">
                        <div className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1">
                          Tips
                        </div>
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${
                            isCompleted
                              ? isCorrectSign
                                ? 'bg-green-500 text-white'
                                : 'bg-red-500/20 text-red-500'
                              : 'bg-primary text-primary-foreground'
                          }`}
                        >
                          {bet.predictedSign}
                        </div>
                      </div>

                      {isCompleted && (
                        <div className="text-center min-w-[60px]">
                          <div className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1">
                            Poäng
                          </div>
                          <div
                            className={`font-black text-xl ${earnedPoints > 0 ? 'text-green-500' : 'text-muted-foreground'}`}
                          >
                            +{earnedPoints}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-card border border-dashed border-border rounded-3xl p-12 text-center">
              <p className="text-muted-foreground font-medium italic">
                Inga låsta matchtips ännu.
              </p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: GROUP & SIDEBETS */}
        <div className="space-y-8">
          {/* SIDEBETS */}
          <div className="space-y-4">
            <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              Kristallkulan
            </h3>
            {lockedSidebets.length > 0 ? (
              <div className="space-y-3">
                {lockedSidebets.map((bet) => {
                  const isEvaluated = bet.question.correctAnswer !== null;
                  const isCorrect =
                    isEvaluated && bet.answer === bet.question.correctAnswer;

                  return (
                    <div
                      key={bet.id}
                      className="bg-card border border-border rounded-2xl p-4"
                    >
                      <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 line-clamp-2 leading-tight">
                        {bet.question.question}
                      </div>
                      <div className="flex items-end justify-between">
                        <div
                          className={`font-bold ${isEvaluated ? (isCorrect ? 'text-green-500' : 'text-red-500 line-through opacity-70') : 'text-foreground'}`}
                        >
                          {bet.answer}
                        </div>
                        {isEvaluated && (
                          <div className="text-[10px] font-black">
                            {isCorrect ? `+${bet.pointsAwarded}p` : '0p'}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground italic bg-secondary/30 p-4 rounded-xl">
                Inga låsta sidospel.
              </div>
            )}
          </div>

          {/* GROUP PLACEMENTS */}
          <div className="space-y-4">
            <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              Gruppspel
            </h3>
            {!tournamentStarted ? (
              <div className="text-sm text-muted-foreground italic bg-secondary/30 p-4 rounded-xl">
                Grupptips låses när turneringen startar.
              </div>
            ) : lockedGroupBets.length > 0 ? (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                {['A', 'B', 'C', 'D', 'E', 'F'].map((groupName) => {
                  const groupBets = lockedGroupBets.filter(
                    (b) => b.groupName === groupName
                  );
                  if (groupBets.length === 0) return null;

                  return (
                    <div
                      key={groupName}
                      className="border-b border-border/50 last:border-0 p-4"
                    >
                      <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">
                        Grupp {groupName}
                      </div>
                      <div className="space-y-2">
                        {groupBets.map((bet) => (
                          <div
                            key={bet.id}
                            className="flex justify-between items-center text-sm"
                          >
                            <div className="flex items-center gap-2 font-medium">
                              <span className="text-muted-foreground w-4">
                                {bet.predictedRank}.
                              </span>
                              <TeamBadge teamName={bet.teamName} />
                            </div>
                            {bet.pointsAwarded > 0 && (
                              <span className="text-[10px] font-black text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded">
                                +{bet.pointsAwarded}p
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground italic bg-secondary/30 p-4 rounded-xl">
                Inga låsta grupptips.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
