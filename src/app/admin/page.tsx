import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateMatchResult, clearAllBets, generateRandomGroupBets, simulateMatch, clearMatchResult, updateKnockoutTeams, clearAllMatchResults, seedCrystalBallQuestions, resolveCrystalBallQuestion } from "./actions";
import { approveUser, deleteUser } from "./userActions";
import Link from "next/link";
import DataSyncButton from "./DataSyncButton";
import { UserCheck, UserX, Trash2, Dices, Edit3, Sparkles } from "lucide-react";
import AdminGroupStandings from "./AdminGroupStandings";
import UserTableRow from "./UserTableRow";


export default async function AdminPage(props: { searchParams: Promise<{ tab?: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.isAdmin) {
    redirect("/");
  }

  const searchParams = await props.searchParams;
  const activeTab = searchParams.tab || 'matches';

  const [matches, users, officialStandings, crystalQuestions] = await Promise.all([
    prisma.match.findMany({ orderBy: { kickoff: "asc" } }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.officialGroupStanding.findMany(),
    prisma.sidebetQuestion.findMany({ orderBy: { points: 'desc' } })
  ]);

  const unapprovedUsers = users.filter(u => !u.isApproved);
  const approvedUsers = users.filter(u => u.isApproved);

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

  const knockoutMatches = matches.filter(m => !m.groupName && !m.isCompleted);

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Admin-panel</h1>
          <p className="text-muted-foreground mt-1 text-sm">Hantera matcher, användare och låsningar.</p>
        </div>
        
        <div className="flex flex-wrap gap-2 bg-secondary/30 p-1 rounded-xl border border-border">
          <Link 
            href="?tab=matches" 
            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'matches' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Gruppspel
          </Link>
          <Link 
            href="?tab=standings" 
            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'standings' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Tabeller
          </Link>
          <Link 
            href="?tab=knockout" 
            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'knockout' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Slutspel
          </Link>
          <Link 
            href="?tab=users" 
            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Användare {unapprovedUsers.length > 0 && <span className="ml-1 bg-destructive text-white px-1.5 py-0.5 rounded-full text-[8px] animate-pulse">{unapprovedUsers.length}</span>}
          </Link>
          <Link 
            href="?tab=settings" 
            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'settings' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Data/Inst.
          </Link>
        </div>
      </div>

      {activeTab === 'users' && (
        <div className="space-y-8">
          {/* VÄNTAR PÅ GODKÄNNANDE */}
          <section className="bg-card p-6 rounded-2xl shadow-lg border border-border space-y-6">
            <h2 className="text-xl font-bold text-foreground border-b border-border pb-4 flex items-center gap-2">
              <UserX className="text-destructive" size={20} /> Väntar på godkännande ({unapprovedUsers.length})
            </h2>
            
            {unapprovedUsers.length > 0 ? (
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
            ) : (
              <p className="text-sm text-muted-foreground italic">Inga nya användare väntar på godkännande.</p>
            )}
          </section>

          {/* ALLA ANVÄNDARE */}
          <section className="bg-card p-6 rounded-2xl shadow-lg border border-border space-y-6">
            <h2 className="text-xl font-bold text-foreground border-b border-border pb-4 flex items-center gap-2">
              <UserCheck className="text-primary" size={20} /> Godkända Användare ({approvedUsers.length})
            </h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead>
                  <tr className="text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    <th className="pb-4">Namn & Email</th>
                    <th className="pb-4">Poäng</th>
                    <th className="pb-4 text-right">Åtgärder</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {approvedUsers.map(u => (
                    <UserTableRow key={u.id} user={u} />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-12">
          
          <section className="bg-card p-6 rounded-2xl shadow-lg border border-border space-y-6">
            <h2 className="text-xl font-bold text-foreground border-b border-border pb-4">Data & Inställningar</h2>
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-4">
              <div>
                <p className="font-bold text-foreground">GitHub Data Synk</p>
                <p className="text-sm text-muted-foreground">Hämta det senaste spelschemat från openfootball. <b>Varning: Nollställer och skriver över nuvarande träd.</b></p>
              </div>
              <DataSyncButton />
            </div>
          </section>

          <section className="bg-card p-6 rounded-2xl shadow-lg border border-border space-y-6">
            <h2 className="text-xl font-bold text-foreground border-b border-border pb-4">Testverktyg & Simulering</h2>
            <p className="text-sm text-muted-foreground mb-4">Verktyg för att simulera data och rensa tips för att testa systemet. Varning: Ändrar data för alla användare!</p>
            
            <div className="flex flex-wrap gap-4">
              <form action={clearAllBets} className="flex-1 min-w-[200px]">
                <button type="submit" className="w-full flex items-center justify-center gap-2 bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 px-4 py-2 rounded-lg font-bold text-sm transition-colors">
                  <Trash2 size={16} /> Rensa ALLA Tips
                </button>
              </form>
              <form action={generateRandomGroupBets} className="flex-1 min-w-[200px]">
                <button type="submit" className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 px-4 py-2 rounded-lg font-bold text-sm transition-colors">
                  <Dices size={16} /> Slumpa Grupp-Tips
                </button>
              </form>
              <form action={clearAllMatchResults} className="flex-1 min-w-[200px]">
                <button type="submit" className="w-full flex items-center justify-center gap-2 bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 px-4 py-2 rounded-lg font-bold text-sm transition-colors">
                  <Trash2 size={16} /> Rensa alla Matcher
                </button>
              </form>
            </div>
          </section>

          {/* KRISTALLKULAN ADMIN */}
          <section className="bg-card p-6 rounded-2xl shadow-lg border border-purple-500/30 space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-xl font-bold text-purple-400 flex items-center gap-2">
                <Sparkles size={20} /> Rätta Kristallkulan
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Sätt facit för långtidsspelen. Poäng delas ut direkt.</p>
            </div>
            </div>

            {crystalQuestions.length === 0 ? (
            <form action={seedCrystalBallQuestions}>
              <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-sm transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)] hover:scale-[1.02]">
                Starta Kristallkulan (Generera frågor)
              </button>
            </form>
            ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {crystalQuestions.map(q => (
                <div key={q.id} className="bg-secondary/20 p-4 rounded-xl border border-border">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-sm text-foreground">{q.question}</h3>
                    <span className="text-[10px] font-black uppercase text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                      {q.points}p
                    </span>
                  </div>
                  <form action={resolveCrystalBallQuestion} className="space-y-2">
                    <input type="hidden" name="questionId" value={q.id} />
                    <input 
                      type="text" 
                      name="correctAnswer" 
                      defaultValue={q.correctAnswer || ''}
                      placeholder="Skriv in rätt svar..."
                      className="w-full p-2 border border-border rounded bg-background text-sm font-bold focus:ring-2 focus:ring-purple-500"
                    />
                    <button type="submit" className="w-full bg-secondary hover:bg-secondary/80 text-foreground py-2 rounded font-bold text-xs transition-colors border border-border">
                      Spara facit & Rätta
                    </button>
                  </form>
                </div>
              ))}
            </div>
            )}
          </section>
        </div>
      )}

      {activeTab === 'standings' && Object.keys(groups).length > 0 && (
        <section className="bg-card p-6 rounded-2xl shadow-lg border border-border">
          <h2 className="text-xl font-bold text-foreground border-b border-border pb-4 mb-6">Fastställ Grupptabeller</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.keys(groups).map(groupName => {
              const teams = Array.from(groups[groupName]);
              if (teams.length < 2) return null;

              const groupOfficial = officialStandings
                .filter(s => s.groupName === groupName)
                .sort((a, b) => a.rank - b.rank);

              const initialOrder = groupOfficial.length === 4 
                ? groupOfficial.map(s => s.teamName) 
                : teams;

              return (
                <AdminGroupStandings 
                  key={groupName} 
                  groupName={groupName} 
                  teams={initialOrder} 
                  initialIsFinalized={groupOfficial.length === 4}
                />
              );
            })}
          </div>
        </section>
      )}

      {(activeTab === 'matches' || activeTab === 'knockout') && (
        <div className="space-y-8">
          {activeTab === 'knockout' && knockoutMatches.length > 0 && (
            <section className="bg-card p-6 rounded-2xl shadow-lg border border-border space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Hantera Slutspelsträd</h2>
                  <p className="text-sm text-muted-foreground mt-1">Här kan du manuellt byta ut platshållare mot de faktiska lagen som gått vidare.</p>
                </div>
                <Edit3 className="text-primary hidden sm:block" size={24} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {knockoutMatches.map((match) => {
                  const date = new Date(match.kickoff).toLocaleDateString("sv-SE", { month: 'short', day: 'numeric' });
                  return (
                    <div key={match.id} className="bg-secondary/20 p-4 rounded-xl border border-border">
                      <div className="text-xs font-black text-muted-foreground uppercase mb-3 flex justify-between">
                        <span>{match.stage}</span>
                        <span>{date}</span>
                      </div>
                      <form action={updateKnockoutTeams} className="space-y-3">
                        <input type="hidden" name="matchId" value={match.id} />
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold w-12">Hemma:</span>
                          <input 
                            type="text" 
                            name="homeTeam" 
                            defaultValue={match.homeTeam} 
                            className="flex-1 p-2 border border-border rounded bg-background text-sm font-bold focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold w-12">Borta:</span>
                          <input 
                            type="text" 
                            name="awayTeam" 
                            defaultValue={match.awayTeam} 
                            className="flex-1 p-2 border border-border rounded bg-background text-sm font-bold focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <button type="submit" className="w-full bg-secondary hover:bg-secondary/80 text-foreground py-2 rounded font-bold text-xs mt-2 transition-colors border border-border">
                          Uppdatera Lagen
                        </button>
                      </form>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden">
            <div className="px-4 py-4 md:px-6 md:py-5 border-b border-border bg-secondary/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
              <h2 className="text-xl font-bold text-foreground">
                {activeTab === 'matches' ? 'Gruppspelsmatcher' : 'Slutspelsmatcher'}
              </h2>
              <span className="text-xs font-bold bg-primary/20 text-primary px-2 py-1 rounded">DELAR UT POTTPoäng</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-card">
                  <tr>
                    <th scope="col" className="px-4 py-3 md:px-6 md:py-4 text-left text-[10px] md:text-xs font-black text-muted-foreground uppercase tracking-wider">Tid & Info</th>
                    <th scope="col" className="px-4 py-3 md:px-6 md:py-4 text-center text-[10px] md:text-xs font-black text-muted-foreground uppercase tracking-wider">Hemma - Mål - Borta</th>
                    <th scope="col" className="px-4 py-3 md:px-6 md:py-4 text-right text-[10px] md:text-xs font-black text-muted-foreground uppercase tracking-wider">Resultat</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {matches
                    .filter(m => activeTab === 'matches' ? m.groupName : !m.groupName)
                    .map((match) => {
                    const date = new Date(match.kickoff).toLocaleDateString("sv-SE", { weekday: 'short', month: 'short', day: 'numeric' });
                    const time = new Date(match.kickoff).toLocaleTimeString("sv-SE", { hour: '2-digit', minute: '2-digit' });

                    return (
                      <tr key={match.id} className={match.isCompleted ? "bg-primary/5" : "hover:bg-secondary/30 transition-colors"}>
                        <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap">
                          <div className="text-xs md:text-sm font-bold text-foreground">{date} kl {time}</div>
                          <div className="text-[9px] md:text-[10px] font-black text-muted-foreground uppercase tracking-wider mt-1">{match.stage} {match.groupName && match.groupName !== "TBD" ? `- Grupp ${match.groupName}` : ""}</div>
                        </td>
                        <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap text-center">
                          <form action={updateMatchResult} className="flex flex-col items-center justify-center space-y-2 max-w-[200px] mx-auto">
                            <input type="hidden" name="matchId" value={match.id} />
                            
                            <div className="flex items-center justify-between w-full text-xs md:text-sm font-bold text-foreground px-1 mb-1">
                              <span className="truncate max-w-[70px] text-right">{match.homeTeam}</span>
                              <span className="truncate max-w-[70px] text-left">{match.awayTeam}</span>
                            </div>

                            <div className="flex items-center space-x-2">
                              <input 
                                type="number" 
                                name="homeScore" 
                                defaultValue={match.homeScore ?? ""} 
                                className="w-12 md:w-14 text-center border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none text-sm md:text-lg p-1.5 md:p-2 font-black"
                                placeholder="-"
                              />
                              <span className="text-muted-foreground font-black">-</span>
                              <input 
                                type="number" 
                                name="awayScore" 
                                defaultValue={match.awayScore ?? ""} 
                                className="w-12 md:w-14 text-center border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none text-sm md:text-lg p-1.5 md:p-2 font-black"
                                placeholder="-"
                              />
                            </div>
                            
                            {match.stage !== "Group" && (
                              <div className="flex flex-col items-center gap-1 w-full mt-2">
                                <span className="text-[9px] font-black text-primary uppercase mt-1">Går vidare (inkl ev straffar)</span>
                                <select 
                                  name="actualWinner" 
                                  defaultValue={match.actualWinner ?? ""}
                                  className="w-full p-1.5 border border-border rounded bg-background text-[10px] font-bold"
                                >
                                  <option value="">Välj vinnare...</option>
                                  <option value={match.homeTeam}>{match.homeTeam}</option>
                                  <option value={match.awayTeam}>{match.awayTeam}</option>
                                </select>
                              </div>
                            )}

                            <div className="w-full mt-2 flex gap-2">
                              <button 
                                type="submit" 
                                className="w-full bg-secondary text-foreground border border-border px-3 py-1.5 rounded hover:bg-secondary/80 text-xs font-bold transition-colors"
                              >
                                Spara
                              </button>
                            </div>
                          </form>
                        </td>
                        <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap text-right text-xs md:text-sm">
                          {match.isCompleted ? (
                            <div className="flex flex-col items-end">
                               <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] md:text-[10px] font-black bg-primary/20 text-primary uppercase">
                                Avslutad
                              </span>
                              <span className="text-[10px] md:text-xs font-bold text-muted-foreground mt-1">Tecken: {match.actualSign}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-[10px] md:text-xs italic">Väntar...</span>
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
      )}
    </div>
  );
}
