import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Users, ArrowRight, Shield } from 'lucide-react';
import CreateLeagueForm from './CreateLeagueForm';

export default async function LeaguesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

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
            select: { name: true },
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

      {leagues.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leagues.map((league) => (
            <Link
              key={league.id}
              href={`/leagues/${league.id}`}
              className="bg-card border border-border rounded-[2rem] p-6 hover:border-primary/50 hover:shadow-xl transition-all group flex flex-col justify-between min-h-[220px]"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <Users size={24} />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-foreground uppercase mb-1 group-hover:text-primary transition-colors line-clamp-1">
                  {league.name}
                </h3>
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                  <Shield size={12} className={league.adminId === session.user.id ? "text-yellow-500" : ""} />
                  Admin: {league.admin.name}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                  <span>{league.members.length}</span>
                  <span className="text-[10px] uppercase tracking-widest opacity-60">Medlemmar</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors group-hover:translate-x-1">
                  <ArrowRight size={18} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-card border-2 border-dashed border-border rounded-3xl p-12 text-center max-w-lg mx-auto">
          <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6 text-muted-foreground">
            <Users size={32} />
          </div>
          <h3 className="text-2xl font-black text-foreground uppercase mb-2">Inga Ligor Ännu</h3>
          <p className="text-muted-foreground mb-6">
            Du är inte med i några ligor. Skapa en egen eller be en kompis om en inbjudningslänk!
          </p>
        </div>
      )}
    </div>
  );
}
