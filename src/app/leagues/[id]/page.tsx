import { getServerSession } from 'next-auth';
import { authOptions } from '../../api/auth/[...nextauth]/route';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Users, Shield, ArrowLeft, Trophy, TrendingUp } from 'lucide-react';
import ChatBox from '../ChatBox';
import ShareLeagueButton from '../ShareLeagueButton';
import { DeleteLeagueButton, LeaveLeagueButton } from '../LeagueActionButtons';
import InfoPopover from '@/components/InfoPopover';
import LeagueTrendChart from '@/components/LeagueTrendChart';

export default async function LeagueRoomPage(props: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const params = await props.params;
  const leagueId = params.id;
  const isGlobal = leagueId === 'global';

  let leagueData: any;
  let membersList: any[] = [];
  let commentsList: any[] = [];
  let isAdmin = false;
  let inviteCode = 'GLOBAL';

  if (isGlobal) {
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        totalScore: true,
        matchBets: {
          select: {
            matchId: true,
            pointsAwarded: true,
            pointsAwardedProgress: true,
          },
        },
      },
    });

    leagueData = {
      id: 'global',
      name: 'Globala Tabellen',
      admin: { name: 'System' },
    };

    membersList = allUsers.map((u) => ({
      id: `global-member-${u.id}`,
      userId: u.id,
      user: u,
    }));
  } else {
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                totalScore: true,
                matchBets: {
                  select: {
                    matchId: true,
                    pointsAwarded: true,
                    pointsAwardedProgress: true,
                  },
                },
              },
            },
          },
        },
        admin: {
          select: { id: true, name: true },
        },
        comments: {
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { name: true } },
          },
        },
      },
    });

    if (!league) notFound();

    const isMember = league.members.some((m) => m.userId === session.user.id);
    if (!isMember) {
      redirect(`/leagues/join/${league.inviteCode}`);
    }

    leagueData = league;
    membersList = league.members;
    commentsList = league.comments;
    isAdmin = league.adminId === session.user.id;
    inviteCode = league.inviteCode;
  }

  // Sortera medlemmar efter poäng
  const sortedMembers = [...membersList].sort(
    (a, b) => b.user.totalScore - a.user.totalScore
  );

  // --- BERÄKNA TREND-DATA ---
  const completedMatches = await prisma.match.findMany({
    where: { isCompleted: true },
    orderBy: { kickoff: 'asc' },
    select: { id: true, homeTeam: true, awayTeam: true },
  });

  // I globala ligan ritar vi bara topp 10 för att det inte ska bli rörigt
  const chartMembers = isGlobal ? sortedMembers.slice(0, 10) : sortedMembers;
  const chartLines = chartMembers.map((m) => m.user.name);
  const chartData: any[] = [];

  const currentScores: Record<string, number> = {};
  chartLines.forEach((name) => (currentScores[name] = 0)); // Starta alla på 0

  completedMatches.forEach((match) => {
    const point: any = { name: `${match.homeTeam}-${match.awayTeam}` };
    let anyPointsAwarded = false;

    chartMembers.forEach((member) => {
      const bet = member.user.matchBets.find(
        (b: any) => b.matchId === match.id
      );
      if (bet) {
        const points = bet.pointsAwarded + bet.pointsAwardedProgress;
        currentScores[member.user.name] += points;
        if (points > 0) anyPointsAwarded = true;
      }
      point[member.user.name] = currentScores[member.user.name];
    });

    chartData.push(point);
  });

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-bold text-sm uppercase tracking-widest"
        >
          <ArrowLeft size={16} /> Tillbaka
        </Link>

        {!isGlobal && (
          <div className="flex flex-wrap items-center gap-2">
            <ShareLeagueButton inviteCode={inviteCode} />

            {isAdmin ? (
              <DeleteLeagueButton leagueId={leagueData.id} />
            ) : (
              <LeaveLeagueButton leagueId={leagueData.id} />
            )}
          </div>
        )}
      </div>

      <div
        className={`bg-card border ${isGlobal ? 'border-primary/50' : 'border-border'} rounded-[2rem] p-8 md:p-12 relative overflow-hidden shadow-2xl`}
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <span
              className={`text-[10px] font-black ${isGlobal ? 'bg-primary/20 text-primary' : 'bg-primary text-primary-foreground'} px-3 py-1 rounded-full uppercase tracking-[0.2em]`}
            >
              {isGlobal ? '🌍 Officiell Tabell' : 'Privat Liga'}
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-foreground uppercase tracking-tighter mb-4">
            {leagueData.name}
          </h1>
          <div className="flex items-center gap-4 text-muted-foreground font-medium">
            {!isGlobal && (
              <div className="flex items-center gap-1.5">
                <Shield size={16} className="text-yellow-500" />
                <span>
                  Admin:{' '}
                  <span className="text-foreground font-bold">
                    {leagueData.admin.name}
                  </span>
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Users size={16} />
              <span>{membersList.length} Medlemmar</span>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`grid grid-cols-1 ${isGlobal ? 'lg:grid-cols-1 max-w-4xl mx-auto' : 'lg:grid-cols-3'} gap-8`}
      >
        {/* LEFT COL: TRENDS & LEADERBOARD */}
        <div className={`${isGlobal ? '' : 'lg:col-span-2'} space-y-12`}>
          {/* LEADERBOARD SECTION */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Trophy className="text-yellow-500" size={28} />
              <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">
                Topplista
              </h2>
              {!isGlobal && (
                <InfoPopover title="Globala Poäng">
                  <p>
                    Observera att denna tabell visar medlemmarnas{' '}
                    <b>totala globala poäng</b>. Dina poäng är desamma i alla
                    ligor du är med i.
                  </p>
                  <p className="mt-2 text-xs italic">
                    Syftet med ligan är att jämföra dina globala poäng mot just
                    dessa vänner.
                  </p>
                </InfoPopover>
              )}
            </div>

            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-lg">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-secondary/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <th className="px-6 py-4 w-16">Pos</th>
                    <th className="px-6 py-4">Spelare</th>
                    <th className="px-6 py-4 text-center">Rätt</th>
                    <th className="px-6 py-4 text-right">Poäng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sortedMembers.map((member, index) => {
                    const isMe = member.userId === session.user.id;
                    const pos = index + 1;
                    return (
                      <tr
                        key={member.id}
                        className={`${isMe ? 'bg-primary/5' : ''} transition-colors hover:bg-secondary/30`}
                      >
                        <td className="px-6 py-5">
                          <span
                            className={`flex items-center justify-center w-8 h-8 rounded-lg font-black text-sm ${
                              pos === 1
                                ? 'bg-yellow-500 text-white'
                                : pos === 2
                                  ? 'bg-slate-300 text-slate-700'
                                  : pos === 3
                                    ? 'bg-amber-600 text-white'
                                    : 'text-muted-foreground'
                            }`}
                          >
                            {pos}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="font-bold text-foreground flex items-center gap-2">
                            {member.user.name}
                            {isMe && (
                              <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase">
                                Du
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center font-bold text-muted-foreground">
                          {
                            member.user.matchBets.filter(
                              (b: any) =>
                                b.pointsAwarded > 0 ||
                                b.pointsAwardedProgress > 0
                            ).length
                          }
                        </td>
                        <td className="px-6 py-5 text-right">
                          <span className="font-black text-lg text-primary">
                            {member.user.totalScore}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* TRENDS SECTION */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="text-primary" size={28} />
            <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">
              Formkurva
            </h2>
            <InfoPopover title="Poängutveckling">
              <p>
                Grafen visar medlemmarnas kumulativa poäng match för match (i
                kronologisk ordning).
              </p>
              {isGlobal && (
                <p className="mt-2 text-xs italic">
                  Eftersom detta är den globala tabellen visas endast de 10
                  bästa spelarna i grafen.
                </p>
              )}
            </InfoPopover>
          </div>

          <div className="bg-card border border-border rounded-3xl p-6 shadow-lg">
            <LeagueTrendChart data={chartData} lines={chartLines} />
          </div>
        </div>

        {/* CHAT COL */}
        {!isGlobal && (
          <div className="lg:col-span-1">
            <ChatBox
              leagueId={leagueData.id}
              initialComments={commentsList}
              currentUserId={session.user.id}
            />
          </div>
        )}
      </div>
    </div>
  );
}
