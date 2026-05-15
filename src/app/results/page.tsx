import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { FileClock, Info } from 'lucide-react';
import TeamBadge from '@/components/TeamBadge';
import InfoPopover from '@/components/InfoPopover';

export default async function ResultsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const completedMatches = await prisma.match.findMany({
    where: { isCompleted: true },
    orderBy: { kickoff: 'desc' },
    include: {
      bets: {
        where: { userId: session.user.id }, // Hämta bara inloggad användares bet
      },
    },
  });

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 space-y-12 max-w-4xl mx-auto">
      <section>
        <div className="flex items-center gap-3 text-foreground border-b border-border pb-6">
          <FileClock className="text-primary" size={28} />
          <h2 className="text-3xl font-black uppercase tracking-wider">
            Matcharkiv
          </h2>
          <InfoPopover title="Matcharkiv">
            <p>Här kan du i efterhand granska alla färdigspelade matcher och se exakt hur många poäng dina tips genererade.</p>
          </InfoPopover>
        </div>
        
        <div className="mt-8 space-y-6">
          {completedMatches.length > 0 ? (
            completedMatches.map((match) => {
              const myBet = match.bets[0]; // Det finns bara max ett bet per användare per match
              const pointsEarned = myBet ? (myBet.pointsAwarded + myBet.pointsAwardedProgress) : 0;
              const isCorrect = myBet && myBet.pointsAwarded > 0;

              return (
                <div
                  key={match.id}
                  className={`bg-card border-2 ${isCorrect ? 'border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'border-border'} rounded-[2rem] overflow-hidden`}
                >
                  <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex-1 space-y-2 w-full">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black bg-secondary px-2 py-0.5 rounded text-muted-foreground uppercase">
                          {match.groupName ? `Grupp ${match.groupName}` : match.stage}
                        </span>
                        <span className="text-xs font-bold text-muted-foreground">
                          {new Date(match.kickoff).toLocaleDateString('sv-SE', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center bg-secondary/20 p-4 rounded-xl">
                        <div className="flex-1 flex flex-col items-center gap-1">
                          <TeamBadge teamName={match.homeTeam} />
                        </div>
                        <div className="flex items-center gap-4 text-3xl font-black text-foreground">
                          <span>{match.homeScore}</span>
                          <span className="text-muted-foreground opacity-30">-</span>
                          <span>{match.awayScore}</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center gap-1">
                          <TeamBadge teamName={match.awayTeam} reversed />
                        </div>
                      </div>
                    </div>

                    <div className="w-full md:w-auto flex md:flex-col gap-4 justify-between items-center bg-secondary/10 p-4 rounded-xl border border-border">
                      <div className="text-center">
                        <div className="text-[10px] font-black text-muted-foreground uppercase mb-1">
                          Rätt Tecken
                        </div>
                        <div className="w-10 h-10 rounded-lg border-2 border-primary/50 text-primary flex items-center justify-center font-black text-xl mx-auto bg-primary/10">
                          {match.actualSign}
                        </div>
                      </div>

                      <div className="w-px h-10 md:w-full md:h-px bg-border"></div>

                      <div className="text-center">
                        <div className="text-[10px] font-black text-muted-foreground uppercase mb-1">
                          Ditt Tips
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <span className={`text-xl font-black ${isCorrect ? 'text-green-500' : 'text-foreground'}`}>
                            {myBet ? myBet.predictedSign : '-'}
                          </span>
                          <span className={`text-xs font-bold px-2 py-1 rounded ${isCorrect ? 'bg-green-500/20 text-green-500' : 'bg-secondary text-muted-foreground'}`}>
                            +{pointsEarned}p
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-secondary/20 border border-dashed border-border rounded-[2rem] p-12 text-center text-muted-foreground font-medium italic">
              Inga matcher har spelats ännu.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
