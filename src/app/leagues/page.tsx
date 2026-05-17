import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Users, ArrowRight, Shield } from 'lucide-react';
import CreateLeagueForm from './CreateLeagueForm';

export default async function LeaguesPage(props: {
  searchParams: Promise<{ global?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const searchParams = await props.searchParams;
  const showGlobal = searchParams.global === 'true';

  const leagues = await prisma.league.findMany({
    where: {
      members: {
        some: {
          userId: session.user.id,
        },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, totalScore: true },
          },
        },
      },
      admin: {
        select: { name: true },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const allUsersCount = await prisma.user.count();
  const allUsers = await prisma.user.findMany({
    orderBy: { totalScore: 'desc' },
    select: { id: true, name: true, totalScore: true }
  });
  const globalRank = allUsers.findIndex(u => u.id === session.user.id) + 1;
  const myTotalScore = allUsers.find(u => u.id === session.user.id)?.totalScore || 0;

  if (showGlobal) {
    return (
      <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between border-b border-border pb-6">
          <div>
            <Link href="/leagues" className="text-primary font-black text-[10px] uppercase tracking-[0.2em] mb-2 block hover:underline">
              &larr; Tillbaka till mina ligor
            </Link>
            <h1 className="text-4xl font-black text-foreground tracking-tight uppercase">
              Globala Tabellen
            </h1>
          </div>
          <div className="text-right">
             <div className="text-3xl font-black text-primary">#{globalRank}</div>
             <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Din Ranking</div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl">
          <table className="w-full">
            <thead className="bg-secondary/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pos</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Spelare</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Poäng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {allUsers.map((u, i) => (
                <tr key={u.id} className={`${u.id === session.user.id ? 'bg-primary/5' : ''}`}>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-black ${i === 0 ? 'bg-yellow-500 text-black' : i === 1 ? 'bg-slate-300 text-black' : i === 2 ? 'bg-amber-600 text-white' : 'text-muted-foreground'}`}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-foreground flex items-center gap-2">
                      {u.name}
                      {u.id === session.user.id && <span className="text-[8px] bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase">Du</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="font-black text-lg">{u.totalScore}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-border pb-8">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tight uppercase">
            Mina Ligor
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Här är ligorna du är medlem i.
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
           <CreateLeagueForm />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* GLOBAL TABLE CARD */}
        <Link
          href="/leagues?global=true"
          className="bg-card border-2 border-primary/20 rounded-[2rem] p-6 hover:border-primary/50 hover:shadow-xl transition-all group flex flex-col justify-between min-h-[260px] relative overflow-hidden shadow-[0_0_20px_rgba(var(--primary),0.05)]"
        >
          <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
              <span className="text-8xl font-black italic tracking-tighter text-primary">#{globalRank}</span>
          </div>

          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <span className="text-2xl">🌍</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-primary">#{globalRank}</div>
                <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none">Global Rank</div>
              </div>
            </div>
            <h3 className="text-2xl font-black text-foreground uppercase mb-1 group-hover:text-primary transition-colors line-clamp-1">
              Globala Tabellen
            </h3>
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-4">
              Officiell VM-Ranking
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-primary/5 rounded-2xl p-3 flex justify-between items-center">
              <div>
                <div className="text-lg font-black text-foreground">{myTotalScore}</div>
                <div className="text-[9px] font-black uppercase text-muted-foreground tracking-widest leading-none">Dina Poäng</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-black text-foreground">{allUsersCount}</div>
                <div className="text-[9px] font-black uppercase text-muted-foreground tracking-widest leading-none">Spelare Totalt</div>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground transition-colors group-hover:translate-x-1">
                <ArrowRight size={14} />
              </div>
            </div>
          </div>
        </Link>

        {leagues.map((league) => {
            // Beräkna rank i denna liga
            const sortedMembers = [...league.members].sort((a, b) => b.user.totalScore - a.user.totalScore);
            const myRank = sortedMembers.findIndex(m => m.userId === session.user.id) + 1;
            const myScore = league.members.find(m => m.userId === session.user.id)?.user.totalScore || 0;

            return (
              <Link
                key={league.id}
                href={`/leagues/${league.id}`}
                className="bg-card border border-border rounded-[2rem] p-6 hover:border-primary/50 hover:shadow-xl transition-all group flex flex-col justify-between min-h-[260px] relative overflow-hidden"
              >
                {/* Dekorativ bakgrund för ranking */}
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                   <span className="text-8xl font-black italic tracking-tighter">#{myRank}</span>
                </div>

                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <Users size={24} />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-primary">#{myRank}</div>
                      <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none">Placering</div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-foreground uppercase mb-1 group-hover:text-primary transition-colors line-clamp-1">
                    {league.name}
                  </h3>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-4">
                    <Shield size={12} className={league.adminId === session.user.id ? "text-yellow-500" : ""} />
                    Admin: {league.admin.name}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-secondary/30 rounded-2xl p-3 flex justify-between items-center">
                    <div>
                      <div className="text-lg font-black text-foreground">{myScore}</div>
                      <div className="text-[9px] font-black uppercase text-muted-foreground tracking-widest leading-none">Dina Poäng</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-foreground">{league.members.length}</div>
                      <div className="text-[9px] font-black uppercase text-muted-foreground tracking-widest leading-none">Spelare</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {sortedMembers.slice(0, 3).map((m) => (
                        <div key={m.id} className="w-6 h-6 rounded-full bg-primary border-2 border-card flex items-center justify-center text-[8px] font-black text-primary-foreground">
                          {m.user.name?.charAt(0)}
                        </div>
                      ))}
                      {league.members.length > 3 && (
                        <div className="w-6 h-6 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-[8px] font-black text-muted-foreground">
                          +{league.members.length - 3}
                        </div>
                      )}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors group-hover:translate-x-1">
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
      </div>
    </div>
  );
}
