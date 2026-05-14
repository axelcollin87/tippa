import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Trophy, Medal, AlertCircle, Calendar, ArrowRight } from 'lucide-react';
import Countdown from '@/components/Countdown';
import TeamBadge from '@/components/TeamBadge';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // 1. Hämta data parallellt
  const [users, allMatches, userBets] = await Promise.all([
    prisma.user.findMany({
      orderBy: { totalScore: 'desc' },
      select: { id: true, name: true, totalScore: true },
    }),
    prisma.match.findMany({
      orderBy: { kickoff: 'asc' },
    }),
    prisma.matchBet.findMany({
      where: { userId: session.user.id },
    }),
  ]);

  // 2. Beräkna saknade tips
  const missingBetsCount = allMatches.filter(
    (m) =>
      !userBets.some((b) => b.matchId === m.id) &&
      new Date() < new Date(m.kickoff.getTime() - 60 * 60 * 1000)
  ).length;

  // 3. Hitta dagens matcher (eller de närmast kommande 3 om inga spelas idag)
  const upcomingMatches = allMatches.filter((m) => !m.isCompleted).slice(0, 4);

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 space-y-8 max-w-5xl mx-auto">
      {/* 1. ACTION CARD (Välkomstmodul) */}
      <div className="bg-card rounded-2xl shadow-xl border border-border relative overflow-hidden p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight text-balance">
              Hej, {session.user.name?.toUpperCase()}!
            </h1>
            {missingBetsCount > 0 ? (
              <div className="mt-2 flex items-center gap-2 text-primary animate-pulse">
                <AlertCircle size={20} />
                <p className="font-bold">
                  Du har {missingBetsCount} otippade matcher!
                </p>
              </div>
            ) : (
              <p className="mt-2 text-muted-foreground font-medium">
                Du har tippat alla kommande matcher. Snyggt!
              </p>
            )}
          </div>

          <Link
            href="/bets"
            className="group w-full md:w-auto bg-primary text-primary-foreground px-8 py-4 rounded-xl font-black text-lg flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] transition-all transform hover:-translate-y-1"
          >
            {missingBetsCount > 0 ? 'TIPPA NU' : 'ÄNDRA TIPS'}
            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 2. DAGENS MATCHER / KOMMANDE */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2 text-foreground">
            <Calendar className="text-primary" size={24} />
            <h2 className="text-xl font-bold uppercase tracking-wider">
              Kommande Matcher
            </h2>
          </div>

          <div className="grid gap-4">
            {upcomingMatches.length > 0 ? (
              upcomingMatches.map((match) => {
                const myBet = userBets.find((b) => b.matchId === match.id);
                return (
                  <div
                    key={match.id}
                    className="bg-card border border-border rounded-xl p-5 flex items-center justify-between group hover:border-primary/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-col gap-1 items-start">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black bg-secondary px-2 py-0.5 rounded text-muted-foreground uppercase">
                            Grupp {match.groupName}
                          </span>
                          <Countdown targetDate={match.kickoff} />
                        </div>
                        {match.ground && (
                          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1">
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
                      <div className="text-lg font-bold text-foreground mt-2 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                        <TeamBadge teamName={match.homeTeam} />
                        <span className="text-muted-foreground font-normal text-xs uppercase hidden sm:inline">
                          vs
                        </span>
                        <TeamBadge teamName={match.awayTeam} />
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">
                        Ditt tips
                      </div>
                      {myBet ? (
                        <div className="flex gap-1 justify-end">
                          {['1', 'X', '2'].map((sign) => {
                            const isSelected = myBet.predictedSign === sign;
                            return (
                              <div
                                key={sign}
                                className={`w-7 h-7 rounded-md flex items-center justify-center font-black text-xs transition-all ${
                                  isSelected
                                    ? 'bg-primary text-primary-foreground shadow-[0_0_10px_rgba(var(--primary),0.4)]'
                                    : 'bg-secondary text-secondary-foreground/30 border border-border/50'
                                }`}
                              >
                                {sign}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-[10px] font-bold text-destructive uppercase italic bg-destructive/10 px-2 py-1 rounded">
                          Ej tippad
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center text-muted-foreground">
                Inga kommande matcher just nu.
              </div>
            )}
          </div>

          <Link
            href="/bets"
            className="block text-center text-sm font-bold text-primary hover:underline uppercase tracking-widest"
          >
            Visa alla matcher &rarr;
          </Link>
        </div>

        {/* 3. MINI LEADERBOARD */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-foreground">
            <Trophy className="text-primary" size={24} />
            <h2 className="text-xl font-bold uppercase tracking-wider">
              Topplistan
            </h2>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
            <div className="divide-y divide-border">
              {users.slice(0, 5).map((user, index) => {
                const isCurrentUser = user.id === session.user.id;
                return (
                  <div
                    key={user.id}
                    className={`flex items-center px-4 py-3 ${isCurrentUser ? 'bg-primary/5' : ''}`}
                  >
                    <div className="w-8 flex justify-center">
                      {index === 0 ? (
                        <Medal className="text-yellow-500 w-5 h-5" />
                      ) : index === 1 ? (
                        <Medal className="text-gray-400 w-5 h-5" />
                      ) : index === 2 ? (
                        <Medal className="text-amber-700 w-5 h-5" />
                      ) : (
                        <span className="text-xs font-bold text-muted-foreground">
                          #{index + 1}
                        </span>
                      )}
                    </div>
                    <div className="ml-3 flex-1">
                      <p
                        className={`text-sm font-bold truncate ${isCurrentUser ? 'text-primary' : 'text-foreground'}`}
                      >
                        {user.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black">
                        {user.totalScore}
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground ml-0.5">
                        P
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <Link
              href="/"
              className="block py-3 text-center text-[10px] font-black uppercase tracking-tighter bg-secondary/50 hover:bg-secondary text-muted-foreground transition-colors border-t border-border"
            >
              Visa fullständig tabell
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
