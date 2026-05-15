import { getServerSession } from 'next-auth';
import { authOptions } from '../../../api/auth/[...nextauth]/route';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Users, LogIn, ArrowLeft } from 'lucide-react';
import { joinLeague } from '../../actions';

export default async function JoinLeaguePage(props: { params: Promise<{ code: string }> }) {
  const session = await getServerSession(authOptions);
  
  // Om användaren inte är inloggad, skicka till login med en callbackUrl
  if (!session) {
    const params = await props.params;
    redirect(`/login?callbackUrl=/leagues/join/${params.code}`);
  }

  const params = await props.params;
  const inviteCode = params.code.toUpperCase();

  const league = await prisma.league.findUnique({
    where: { inviteCode },
    include: {
      admin: { select: { name: true } },
      members: { select: { userId: true } }
    }
  });

  if (!league) {
    return (
      <div className="py-20 px-4 flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl font-black uppercase mb-4 text-destructive">Ogiltig Länk</h1>
        <p className="text-muted-foreground mb-8">Vi kunde inte hitta någon liga med den inbjudningskoden.</p>
        <Link href="/leagues" className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold uppercase tracking-widest hover:opacity-90 transition-opacity">
          Gå till dina ligor
        </Link>
      </div>
    );
  }

  // Kolla om användaren redan är medlem
  const isMember = league.members.some(m => m.userId === session.user.id);
  if (isMember) {
    redirect(`/leagues/${league.id}`);
  }

  return (
    <div className="py-20 px-4 flex flex-col items-center justify-center">
      <Link href="/leagues" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-bold text-sm uppercase tracking-widest mb-12">
        <ArrowLeft size={16} /> Tillbaka
      </Link>

      <div className="bg-card border border-border rounded-[2rem] p-8 md:p-12 w-full max-w-lg text-center shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -ml-20 -mt-20 pointer-events-none"></div>
         
         <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary relative z-10">
            <Users size={32} />
         </div>

         <h2 className="text-sm font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 relative z-10">Inbjudan</h2>
         <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter mb-4 relative z-10">
            {league.name}
         </h1>
         <p className="text-muted-foreground font-medium mb-8 relative z-10">
            Admin: {league.admin.name} • {league.members.length} Medlemmar
         </p>

         <form action={joinLeague} className="relative z-10">
            <input type="hidden" name="inviteCode" value={inviteCode} />
            <button 
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-black text-lg uppercase tracking-widest hover:scale-105 transition-transform shadow-[0_0_30px_rgba(var(--primary),0.3)]"
            >
              <LogIn size={20} /> Gå med i ligan
            </button>
         </form>
      </div>
    </div>
  );
}
