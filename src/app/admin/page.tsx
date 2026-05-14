import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateMatchResult, toggleGroupStageLock, finalizeGroupStandings } from "./actions";
import { approveUser, deleteUser } from "./userActions";
import Link from "next/link";
import DataSyncButton from "./DataSyncButton";
import { UserCheck, UserX } from "lucide-react";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.isAdmin) {
    redirect("/");
  }

  const [matches, config, users] = await Promise.all([
    prisma.match.findMany({ orderBy: { kickoff: "asc" } }),
    prisma.globalConfig.findUnique({ where: { id: "global" } }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" } })
  ]);

  const isGroupLocked = config?.groupStageLocked ?? false;
  const unapprovedUsers = users.filter(u => !u.isApproved);

  const groups: Record<string, Set<string>> = {};
  for (const match of matches) {
    if (match.groupName && match.groupName !== "TBD") {
      if (!groups[match.groupName]) groups[match.groupName] = new Set();
      if (match.homeTeam && !match.homeTeam.includes("Winner") && !match.homeTeam.includes("Runner-up") && !match.homeTeam.match(/^\d[A-L]$/)) {
         groups[match.groupName].add(match.homeTeam);
      }
      if (match.awayTeam && !match.awayTeam.includes("Winner") && !match.awayTeam.includes("Runner-up") && !match.awayTeam.match(/^\d[A-L]$/)) {
         groups[match.groupName].add(match.awayTeam);
      }
    }
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12">
      
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Admin-panel</h1>
          <p className="text-muted-foreground mt-1 text-sm">Hantera matcher, användare och låsningar.</p>
        </div>
      </div>

      {/* ANVÄNDARHANTERING */}
      <section className="bg-card p-6 rounded-2xl shadow-lg border border-border space-y-6">
        <h2 className="text-xl font-bold text-foreground border-b border-border pb-4">Användarhantering</h2>
        
        {unapprovedUsers.length > 0 ? (
          <div className="space-y-4">
            <h3 className="font-bold text-destructive flex items-center gap-2">
              <UserX size={18} /> Väntar på godkännande ({unapprovedUsers.length})
            </h3>
            <div className="grid gap-3">
              {unapprovedUsers.map(u => (
                <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-secondary/30 p-4 rounded-xl border border-border gap-4">
                  <div>
                    <p className="font-bold text-foreground">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <form action={approveUser} className="flex-1 sm:flex-none">
                      <input type="hidden" name="userId" value={u.id} />
                      <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                        Godkänn
                      </button>
                    </form>
                    <form action={deleteUser} className="flex-1 sm:flex-none">
                      <input type="hidden" name="userId" value={u.id} />
                      <button type="submit" className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                        Neka
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">Inga nya användare väntar på godkännande.</p>
        )}
      </section>

      <section className="bg-card p-6 rounded-2xl shadow-lg border border-border space-y-6">
        <h2 className="text-xl font-bold text-foreground border-b border-border pb-4">Data & Inställningar</h2>
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-4">
          <div>
            <p className="font-bold text-foreground">GitHub Data Synk</p>
            <p className="text-sm text-muted-foreground">Hämta det senaste spelschemat från openfootball.</p>
          </div>
          <DataSyncButton />
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-4 border-t border-border">
          <div>
            <p className="font-bold text-foreground">Lås Grupplaceringar</p>
            <p className="text-sm text-muted-foreground">När VM startar ska du låsa användarnas möjlighet att ändra tabelltips.</p>
          </div>
          <form action={toggleGroupStageLock}>
            <button 
              type="submit"
              className={`px-6 py-2 rounded-lg font-bold text-white transition-colors ${
                isGroupLocked ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.3)]"
              }`}
            >
              {isGroupLocked ? "Lås Upp (Farligt)" : "Lås Gruppspelet"}
            </button>
          </form>
        </div>
      </section>

      {Object.keys(groups).length > 0 && (
        <section className="bg-card p-6 rounded-2xl shadow-lg border border-border">
          <h2 className="text-xl font-bold text-foreground border-b border-border pb-4 mb-6">Fastställ Grupptabeller</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.keys(groups).map(groupName => {
              const teams = Array.from(groups[groupName]);
              if (teams.length < 2) return null; // Skippa grupper utan lag än

              return (
                <div key={groupName} className="p-5 bg-secondary/30 rounded-xl border border-border">
                  <h3 className="font-black text-foreground mb-4 uppercase tracking-wide text-sm">Grupp {groupName}</h3>
                  <form action={finalizeGroupStandings} className="space-y-3">
                    <input type="hidden" name="groupName" value={groupName} />
                    {[1, 2, 3, 4].map(rank => (
                      <div key={rank} className="flex items-center gap-3">
                        <span className="w-6 text-center font-black text-muted-foreground">{rank}.</span>
                        <select name={`rank${rank}`} required className="flex-1 p-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none">
                          <option value="">Välj lag...</option>
                          {teams.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    ))}
                    <button type="submit" className="w-full mt-4 bg-secondary hover:bg-secondary/80 text-foreground py-2.5 rounded-lg font-bold text-sm transition-colors border border-border">
                      Dela ut poäng
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden">
        <div className="px-6 py-5 border-b border-border bg-secondary/50 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Matchresultat</h2>
          <span className="text-xs font-bold bg-primary/20 text-primary px-2 py-1 rounded">DELAR UT POTTPoäng</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-card">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-black text-muted-foreground uppercase tracking-wider">Tid & Grupp</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-black text-muted-foreground uppercase tracking-wider">Hemma</th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-black text-muted-foreground uppercase tracking-wider">Mål</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-black text-muted-foreground uppercase tracking-wider">Borta</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-black text-muted-foreground uppercase tracking-wider">Resultat</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {matches.map((match) => {
                const date = new Date(match.kickoff).toLocaleDateString("sv-SE", { weekday: 'short', month: 'short', day: 'numeric' });
                const time = new Date(match.kickoff).toLocaleTimeString("sv-SE", { hour: '2-digit', minute: '2-digit' });

                return (
                  <tr key={match.id} className={match.isCompleted ? "bg-primary/5" : "hover:bg-secondary/30 transition-colors"}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-foreground">{date} kl {time}</div>
                      <div className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mt-1">{match.stage} {match.groupName !== "TBD" ? `- Grupp ${match.groupName}` : ""}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-foreground">
                      {match.homeTeam}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <form action={updateMatchResult} className="flex items-center justify-center space-x-2">
                        <input type="hidden" name="matchId" value={match.id} />
                        <input 
                          type="number" 
                          name="homeScore" 
                          defaultValue={match.homeScore ?? ""} 
                          className="w-14 text-center border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none sm:text-lg p-2 font-black"
                          placeholder="-"
                        />
                        <span className="text-muted-foreground font-black">-</span>
                        <input 
                          type="number" 
                          name="awayScore" 
                          defaultValue={match.awayScore ?? ""} 
                          className="w-14 text-center border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none sm:text-lg p-2 font-black"
                          placeholder="-"
                        />
                        <button 
                          type="submit" 
                          className="ml-4 bg-secondary text-foreground border border-border px-3 py-1.5 rounded hover:bg-secondary/80 text-xs font-bold transition-colors"
                        >
                          Spara
                        </button>
                      </form>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left font-bold text-foreground">
                      {match.awayTeam}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      {match.isCompleted ? (
                        <div className="flex flex-col items-end">
                           <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-primary/20 text-primary uppercase">
                            Avslutad
                          </span>
                          <span className="text-xs font-bold text-muted-foreground mt-1">Tecken: {match.actualSign}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">Väntar...</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}
