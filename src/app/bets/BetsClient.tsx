'use client';

import { useState, useEffect } from 'react';
import GroupRanking from '@/components/GroupRanking';
import Countdown from '@/components/Countdown';
import InfoPopover from '@/components/InfoPopover';
import { Lock, LayoutGrid, List } from 'lucide-react';
import { STAGE_TRANSLATIONS } from '@/lib/teams';
import MatchCard from '@/components/MatchCard';
import CrystalBallQuestion from './CrystalBallQuestion';
import TeamBadge from '@/components/TeamBadge';

function TreeNodeCard({ match }: { match: any }) {
  const bet = match.bets[0];
  const predictedWinner = bet?.predictedWinner;
  const actualWinner = match.actualWinner;

  const isHomeWinnerPredicted = predictedWinner === match.homeTeam;
  const isAwayWinnerPredicted = predictedWinner === match.awayTeam;

  const isHomeActualWinner = actualWinner === match.homeTeam;
  const isAwayActualWinner = actualWinner === match.awayTeam;

  return (
    <div className="bg-card border border-border p-2.5 rounded-xl shadow-sm flex flex-col gap-1.5 w-full max-w-[260px] shrink-0 text-xs transition-all hover:border-primary/40 hover:shadow-md">
      {/* Match number and date */}
      <div className="flex items-center justify-between text-[8px] font-black text-muted-foreground uppercase border-b border-border/40 pb-1">
        <span>Match {match.id}</span>
        <span>
          {new Date(match.kickoff).toLocaleDateString('sv-SE', {
            day: 'numeric',
            month: 'short',
          })}
        </span>
      </div>

      {/* Teams list */}
      <div className="space-y-1">
        {/* Home Team */}
        <div className={`flex items-center justify-between p-1 rounded transition-colors ${isHomeWinnerPredicted ? 'bg-primary/5 font-extrabold text-primary' : 'text-foreground'}`}>
          <div className="flex items-center gap-1.5 overflow-hidden">
            <TeamBadge teamName={match.homeTeam} className="text-xs font-semibold gap-1.5" />
            {isHomeWinnerPredicted && (
              <span className="text-[7px] bg-primary/20 text-primary px-1 rounded uppercase tracking-tighter shrink-0 font-black">TIP</span>
            )}
            {isHomeActualWinner && match.isCompleted && (
              <span className="text-[7px] bg-green-500 text-white px-1 rounded uppercase tracking-tighter shrink-0 font-black">VIN</span>
            )}
          </div>
          {match.isCompleted && (
            <span className="font-bold">{match.homeScore}</span>
          )}
        </div>

        {/* Away Team */}
        <div className={`flex items-center justify-between p-1 rounded transition-colors ${isAwayWinnerPredicted ? 'bg-primary/5 font-extrabold text-primary' : 'text-foreground'}`}>
          <div className="flex items-center gap-1.5 overflow-hidden">
            <TeamBadge teamName={match.awayTeam} className="text-xs font-semibold gap-1.5" />
            {isAwayWinnerPredicted && (
              <span className="text-[7px] bg-primary/20 text-primary px-1 rounded uppercase tracking-tighter shrink-0 font-black">TIP</span>
            )}
            {isAwayActualWinner && match.isCompleted && (
              <span className="text-[7px] bg-green-500 text-white px-1 rounded uppercase tracking-tighter shrink-0 font-black">VIN</span>
            )}
          </div>
          {match.isCompleted && (
            <span className="font-bold">{match.awayScore}</span>
          )}
        </div>
      </div>
    </div>
  );
}

type BetsClientProps = {
  initialView: string;
  initialGroup: string | null;
  initialStage: string;
  allMatches: any[];
  groupBets: any[];
  officialStandings: any[];
  crystalQuestions: any[];
  crystalBets: any[];
  groupLockTimes: Record<string, Date>;
  groups: Record<string, Set<string>>;
  knockoutMatches: any[];
  groupNames: string[];
  allTeams: { english: string; swedish: string }[];
  isGroupStageFinished: boolean;
  groupStatus: Record<string, 'completed' | 'started' | 'empty'>;
  knockoutStages: Record<string, any[]>;
  knockoutTabs: { id: string; label: string; stages: string[] }[];
  knockoutTabStatus: Record<string, 'completed' | 'started' | 'locked'>;
  isCrystalBallComplete: boolean;
  firstMatchKickoff: Date | null;
};

export default function BetsClient({
  initialView,
  initialGroup,
  initialStage,
  allMatches,
  groupBets,
  officialStandings,
  crystalQuestions,
  crystalBets,
  groupLockTimes,
  groups,
  knockoutMatches,
  groupNames,
  allTeams,
  isGroupStageFinished,
  groupStatus,
  knockoutStages,
  knockoutTabs,
  knockoutTabStatus,
  isCrystalBallComplete,
  firstMatchKickoff,
}: BetsClientProps) {
  const [view, setView] = useState(initialView);
  const [activeGroup, setActiveGroup] = useState<string | null>(
    initialGroup || groupNames[0] || 'A'
  );
  const [activeKnockoutStageId, setActiveKnockoutStageId] =
    useState(initialStage);
  const [layout, setLayout] = useState<'list' | 'grid'>('list');
  const [knockoutView, setKnockoutView] = useState<'matches' | 'tree'>('matches');

  const [isRulesCollapsed, setIsRulesCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('tippwits_knockout_rules_collapsed');
    if (saved === 'true') {
      setIsRulesCollapsed(true);
    }
  }, []);

  const handleToggleRules = () => {
    const newVal = !isRulesCollapsed;
    setIsRulesCollapsed(newVal);
    localStorage.setItem('tippwits_knockout_rules_collapsed', String(newVal));
  };

  const isKnockoutView = view === 'knockout';
  const isCrystalBallView = view === 'crystalball';
  const isGroupView = view === 'group';

  const isTournamentStarted = firstMatchKickoff ? new Date() >= firstMatchKickoff : false;

  const handleTabClick = (newView: string, group?: string, stage?: string) => {
    setView(newView);
    if (group) setActiveGroup(group);
    if (stage) setActiveKnockoutStageId(stage);

    // Update URL cosmetically
    const url = new URL(window.location.href);
    url.searchParams.set('view', newView);
    if (group) url.searchParams.set('group', group);
    else url.searchParams.delete('group');

    if (stage) url.searchParams.set('stage', stage);
    else url.searchParams.delete('stage');

    window.history.replaceState(null, '', url.toString());
  };

  const activeMatches = isKnockoutView
    ? knockoutMatches
    : allMatches.filter((m) => m.groupName === activeGroup);
  const activeTeams = activeGroup ? Array.from(groups[activeGroup] || []) : [];
  const activeUserRanks = activeGroup
    ? groupBets.filter((b) => b.groupName === activeGroup)
    : [];
  const activeOfficialStandings = activeGroup
    ? officialStandings
        .filter((s) => s.groupName === activeGroup)
        .sort((a, b) => a.rank - b.rank)
    : [];

  const activeKnockoutStages = knockoutTabs.find(
    (t) => t.id === activeKnockoutStageId
  )?.stages || ['Round of 32'];

  return (
    <div className="py-6 px-3 sm:py-10 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-3 border-b border-border pb-4 md:pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight uppercase">
            Mina Tips
          </h1>
        </div>

        {/* Deadlines Banner */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 md:p-4 text-xs md:text-sm text-foreground/80 leading-relaxed mt-2">
          <strong className="text-primary uppercase tracking-widest text-[10px] block mb-1">
            Viktigt om Deadlines
          </strong>
          Grupplaceringar (1-4) låses när{' '}
          <span className="font-bold">första matchen i respektive grupp</span>{' '}
          sparkar igång. Enskilda matchtips kan du däremot ändra fram tills{' '}
          <span className="font-bold">1 timme innan avspark</span> för varje
          specifik match.
        </div>

        <div className="flex flex-wrap gap-1.5 md:gap-2 pb-2 mt-2 md:mt-4 items-center">
          <button
            onClick={() => handleTabClick('crystalball')}
            className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full font-black text-[9px] md:text-xs transition-all uppercase tracking-tighter border-2 ${
              isCrystalBallView
                ? 'bg-primary text-primary-foreground scale-105 border-primary shadow-[0_0_15px_rgba(var(--primary),0.4)]'
                : isCrystalBallComplete
                  ? 'bg-card text-muted-foreground hover:bg-secondary border-primary shadow-[0_0_8px_rgba(var(--primary),0.3)]'
                  : 'bg-card text-muted-foreground hover:bg-secondary border-border'
            }`}
          >
            Topp 3 🏆
          </button>

          <div className="w-px h-6 bg-border mx-1 md:mx-2"></div>

          <button
            onClick={() => handleTabClick('group', activeGroup || 'A')}
            className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full font-black text-[9px] md:text-xs transition-all uppercase tracking-tighter border-2 ${
              isGroupView
                ? 'bg-primary/80 text-background scale-105 border-primary shadow-[0_0_15px_rgba(var(--primary),0.4)]'
                : 'bg-card text-muted-foreground hover:bg-secondary border-border'
            }`}
          >
            GRUPPSPEL
          </button>

          <div className="w-px h-6 bg-border mx-1 md:mx-2"></div>

          {knockoutMatches.length > 0 && (
            <button
              onClick={() => handleTabClick('knockout')}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full font-black text-[9px] md:text-xs transition-all uppercase tracking-tighter border-2 ${
                isKnockoutView
                  ? 'bg-primary/80 text-background scale-105 border-primary shadow-[0_0_15px_rgba(var(--primary),0.4)]'
                  : 'bg-card text-muted-foreground hover:bg-secondary border-border'
              }`}
            >
              SLUTSPEL
            </button>
          )}
        </div>

        {isGroupView && (
          <div className="flex flex-wrap gap-1.5 md:gap-2 pt-2 items-center">
            {groupNames.map((g) => {
              const status = groupStatus[g];
              let statusBorder = 'border-border';
              if (status === 'completed')
                statusBorder =
                  'border-primary shadow-[0_0_8px_rgba(var(--primary),0.3)]';
              else if (status === 'started')
                statusBorder =
                  'border-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.3)]';
              else
                statusBorder =
                  'border-destructive shadow-[0_0_8px_rgba(239,68,68,0.3)]';

              return (
                <button
                  key={g}
                  onClick={() => handleTabClick('group', g)}
                  className={`px-3 md:px-4 py-1 md:py-1.5 rounded-full font-black text-[8px] md:text-[10px] transition-all uppercase tracking-widest border ${statusBorder} ${
                    activeGroup === g
                      ? 'bg-primary/20 text-primary border-primary shadow-[0_0_10px_rgba(var(--primary),0.2)] opacity-100'
                      : 'bg-card text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  Grupp {g}
                </button>
              );
            })}
          </div>
        )}

        {isKnockoutView && (
          <div className="flex flex-wrap gap-1.5 md:gap-2 pt-2 items-center">
            {knockoutTabs.map((tab) => {
              const status = knockoutTabStatus[tab.id];
              let statusBorder = 'border-border';
              if (status === 'completed')
                statusBorder =
                  'border-primary shadow-[0_0_8px_rgba(var(--primary),0.3)]';
              else if (status === 'started')
                statusBorder =
                  'border-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.3)]';
              else statusBorder = 'border-border opacity-50';

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick('knockout', undefined, tab.id)}
                  className={`px-3 md:px-4 py-1 md:py-1.5 rounded-full font-black text-[8px] md:text-[10px] transition-all uppercase tracking-widest border ${statusBorder} ${
                    activeKnockoutStageId === tab.id
                      ? 'bg-primary/20 text-primary border-primary shadow-[0_0_10px_rgba(var(--primary),0.2)] opacity-100'
                      : 'bg-card text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {isCrystalBallView ? (
        <section className="space-y-4 md:space-y-6">
          <div className="bg-primary/5 p-6 rounded-3xl border border-primary/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-4xl font-black text-primary uppercase tracking-widest flex items-center gap-3">
                <span>🏆</span> TOPP 3 I VM
              </h1>
              <p className="text-muted-foreground mt-2 text-xs md:text-sm max-w-2xl">
                Vem tror du kniper medaljerna? Dessa val måste göras innan första
                matchen i VM blåses igång.
              </p>
            </div>
            
            {firstMatchKickoff && (
              <div className="flex-shrink-0 bg-background border border-primary/20 rounded-2xl p-4 flex flex-col items-center justify-center min-w-[200px]">
                 {isTournamentStarted ? (
                    <div className="text-destructive flex flex-col items-center gap-2">
                       <Lock size={24} />
                       <span className="font-black uppercase tracking-widest text-sm">Låst</span>
                    </div>
                 ) : (
                    <div className="text-center">
                       <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1 block">Tid kvar att tippa</span>
                       <Countdown targetDate={firstMatchKickoff} label="" />
                    </div>
                 )}
              </div>
            )}
          </div>

          {crystalQuestions.length > 0 ? (
            <div className="grid gap-4 md:gap-6 md:grid-cols-3">
              {crystalQuestions.map((q) => {
                const bet = crystalBets.find((b) => b.questionId === q.id);
                // Lås frågan om antingen VM har startat, ELLER om dess specifika lockedAt har passerat
                const isLocked = isTournamentStarted || new Date() > new Date(q.lockedAt);

                return (
                  <CrystalBallQuestion
                    key={q.id}
                    question={q}
                    userBet={bet}
                    allTeams={allTeams}
                    isLocked={isLocked}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 md:py-20 text-muted-foreground border border-dashed border-border rounded-xl md:rounded-2xl">
              Top 3 är inte aktiverad ännu.
            </div>
          )}
        </section>
      ) : !isKnockoutView && activeTeams.length > 0 ? (
        <>
          <section className="space-y-4 md:space-y-6">
            <div className="">
              <div>
                <h1 className="text-2xl md:text-4xl font-black text-primary uppercase tracking-widest">
                  Grupp {activeGroup}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-black text-foreground uppercase tracking-widest">
                  Tabell
                </h2>
                <span className="text-[7px] md:text-[8px] font-black bg-primary/20 text-primary px-2 py-1 rounded">
                  100P PER RÄTT
                </span>
                <InfoPopover title="Grupptippning">
                  <p>
                    Du får <b>100 poäng</b> för varje lag du sätter på exakt
                    rätt position (1:a till 4:e plats) i gruppen efter att sista
                    gruppspelsmatchen är spelad.
                  </p>
                </InfoPopover>
                {activeGroup && groupLockTimes[activeGroup] && (
                  <div className="ml-2 md:ml-4 flex items-center gap-2">
                    {new Date() < new Date(new Date(groupLockTimes[activeGroup]).getTime() - 60 * 60 * 1000) ? (
                      <Countdown
                        targetDate={new Date(groupLockTimes[activeGroup])}
                        label="låses"
                      />
                    ) : (
                      <span className="text-destructive flex items-center gap-1 text-[10px] md:text-xs font-bold uppercase">
                        <Lock size={10} /> Låst
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <GroupRanking
              groupName={activeGroup || 'A'}
              teams={activeTeams}
              initialPlacements={activeUserRanks}
              isLocked={
                activeGroup
                  ? new Date() > new Date(new Date(groupLockTimes[activeGroup]).getTime() - 60 * 60 * 1000)
                  : false
              }
              officialStandings={activeOfficialStandings}
            />
          </section>

          <section className="space-y-4 md:space-y-6 pt-2 md:pt-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-black text-foreground uppercase tracking-widest">
                  Matcher
                </h2>
                <span className="text-[9px] md:text-[10px] font-black bg-secondary text-muted-foreground px-2 py-1 rounded">
                  100p maxpoäng
                </span>
              </div>
              
              {/* Layout Toggle */}
              <div className="flex items-center bg-secondary/30 p-1 rounded-lg border border-border shrink-0">
                <button
                  onClick={() => setLayout('list')}
                  className={`p-1.5 rounded-md transition-all ${layout === 'list' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  title="Lista"
                >
                  <List size={14} />
                </button>
                <button
                  onClick={() => setLayout('grid')}
                  className={`p-1.5 rounded-md transition-all ${layout === 'grid' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  title="Rutnät (Kompakt)"
                >
                  <LayoutGrid size={14} />
                </button>
              </div>
            </div>

            <div className={layout === 'grid' ? "grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid gap-3 md:gap-4"}>
              {activeMatches.map((match) => (
                <div
                  key={match.id}
                  id={`match-${match.id}`}
                  className="scroll-mt-24"
                >
                  <MatchCard match={match} userBet={match.bets[0]} isCompact={layout === 'grid'} />
                </div>
              ))}
            </div>
          </section>
        </>
      ) : isKnockoutView ? (
        <section className="space-y-4 md:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3 gap-3">
            <div>
              <h1 className="text-2xl md:text-4xl font-black text-primary uppercase tracking-widest">
                SLUTSPEL
              </h1>
            </div>

            {/* Sub-view selection and layout toggle */}
            {isGroupStageFinished && (
              <div className="flex items-center gap-3 justify-between sm:justify-end w-full sm:w-auto">
                <div className="flex gap-1.5 bg-secondary/20 p-1 rounded-xl border border-border">
                  <button
                    onClick={() => setKnockoutView('matches')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-wider transition-all ${
                      knockoutView === 'matches'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Tippa Matcher
                  </button>
                  <button
                    onClick={() => setKnockoutView('tree')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-wider transition-all ${
                      knockoutView === 'tree'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Slutspelsträd 🌲
                  </button>
                </div>

                {knockoutView === 'matches' && (
                  <div className="flex items-center bg-secondary/30 p-1 rounded-lg border border-border shrink-0">
                    <button
                      onClick={() => setLayout('list')}
                      className={`p-1.5 rounded-md transition-all ${layout === 'list' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                      title="Lista"
                    >
                      <List size={14} />
                    </button>
                    <button
                      onClick={() => setLayout('grid')}
                      className={`p-1.5 rounded-md transition-all ${layout === 'grid' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                      title="Rutnät (Kompakt)"
                    >
                      <LayoutGrid size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {isGroupStageFinished && knockoutView === 'matches' && (
            isRulesCollapsed ? (
              <div className="bg-primary/5 border border-primary/20 p-3 rounded-xl flex items-center justify-between text-xs text-muted-foreground transition-all">
                <div className="flex items-center gap-2">
                  <span className="text-primary font-black text-[9px] bg-primary/10 px-1.5 py-0.5 rounded tracking-wider uppercase">INFO</span>
                  <span className="font-semibold text-foreground flex items-center gap-1">💡 Slutspelsregler — Viktigt att veta!</span>
                </div>
                <button
                  onClick={handleToggleRules}
                  className="text-primary hover:underline font-bold text-[10px] uppercase tracking-wider cursor-pointer"
                >
                  Visa regler &rarr;
                </button>
              </div>
            ) : (
              <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl md:rounded-2xl space-y-3 relative overflow-hidden transition-all">
                <div className="flex items-center justify-between border-b border-primary/10 pb-2">
                  <h2 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    💡 Slutspelsregler — Viktigt att veta!
                  </h2>
                  <button
                    onClick={handleToggleRules}
                    className="text-muted-foreground hover:text-foreground font-bold text-[10px] uppercase tracking-wider border border-border bg-background px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                  >
                    Minimera
                  </button>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  I slutspelet tippar du <strong>både</strong> resultatet efter full tid (90 minuter) 
                  <strong> och</strong> vilket lag som slutligen går vidare.
                </p>
                <ul className="list-disc pl-4 text-[11px] text-muted-foreground space-y-1">
                  <li><strong>Full tid (1X2):</strong> Om du tror matchen avgörs under ordinarie 90 minuter väljer du <strong>1</strong> (hemma) eller <strong>2</strong> (borta). Om du tror på förlängning/straffar väljer du <strong>X</strong> (oavgjort).</li>
                  <li><strong>Vem går vidare?:</strong> Välj det lag som slutligen avancerar till nästa runda. Det är helt tillåtet att tippa <strong>mot ditt eget resultat</strong> (t.ex. tippa 1 full tid, men att bortalaget ändå tar sig vidare).</li>
                </ul>
                
                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleToggleRules}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-black text-[9px] uppercase tracking-widest px-4 py-2 rounded-lg shadow-sm transition-all cursor-pointer"
                  >
                    Jag förstår 👍
                  </button>
                </div>
              </div>
            )
          )}

          {!isGroupStageFinished ? (
            <div className="text-center py-10 md:py-20 text-muted-foreground border border-dashed border-border rounded-xl md:rounded-2xl flex flex-col items-center gap-3">
              <Lock className="text-muted-foreground opacity-50 w-6 h-6 md:w-8 md:h-8" />
              <p className="font-bold text-sm">
                Denna del öppnar när hela gruppspelet är avslutat.
              </p>
            </div>
          ) : knockoutView === 'tree' ? (
            <div className="space-y-4">
              <div className="bg-primary/5 border border-primary/20 p-3 rounded-xl text-xs text-muted-foreground leading-relaxed flex items-center gap-2">
                <span>💡</span>
                <span><strong>Svep i sidled (vänster/höger)</strong> för att följa trädet från 16-delsfinalerna hela vägen till finalen! Matcherna listas i ordning.</span>
              </div>

              <div className="flex gap-4 md:gap-6 overflow-x-auto snap-x scroll-smooth pb-6 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                {/* 16-delsfinaler */}
                {knockoutMatches.filter((m) => m.stage === 'Round of 32').length > 0 && (
                  <div className="flex-shrink-0 w-[85vw] sm:w-[280px] snap-center flex flex-col gap-3">
                    <h4 className="text-xs font-black text-foreground uppercase border-b border-border pb-1.5 mb-2 sticky top-0 bg-background/95 backdrop-blur z-10 flex justify-between items-center shrink-0">
                      <span>16-delsfinal</span>
                      <span className="text-[9px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded font-black">16 Matcher</span>
                    </h4>
                    <div className="flex flex-col gap-3 overflow-y-auto max-h-[60vh] pr-1 scrollbar-thin">
                      {knockoutMatches
                        .filter((m) => m.stage === 'Round of 32')
                        .sort((a, b) => parseInt(a.id) - parseInt(b.id))
                        .map((m) => (
                          <TreeNodeCard key={m.id} match={m} />
                        ))}
                    </div>
                  </div>
                )}

                {/* Åttondelsfinaler */}
                {knockoutMatches.filter((m) => m.stage === 'Round of 16').length > 0 && (
                  <div className="flex-shrink-0 w-[85vw] sm:w-[280px] snap-center flex flex-col gap-3">
                    <h4 className="text-xs font-black text-foreground uppercase border-b border-border pb-1.5 mb-2 sticky top-0 bg-background/95 backdrop-blur z-10 flex justify-between items-center shrink-0">
                      <span>Åttondelsfinal</span>
                      <span className="text-[9px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded font-black">8 Matcher</span>
                    </h4>
                    <div className="flex flex-col gap-3 overflow-y-auto max-h-[60vh] pr-1 scrollbar-thin">
                      {knockoutMatches
                        .filter((m) => m.stage === 'Round of 16')
                        .sort((a, b) => parseInt(a.id) - parseInt(b.id))
                        .map((m) => (
                          <TreeNodeCard key={m.id} match={m} />
                        ))}
                    </div>
                  </div>
                )}

                {/* Kvartsfinaler */}
                {knockoutMatches.filter((m) => m.stage === 'Quarter-final').length > 0 && (
                  <div className="flex-shrink-0 w-[85vw] sm:w-[280px] snap-center flex flex-col gap-3">
                    <h4 className="text-xs font-black text-foreground uppercase border-b border-border pb-1.5 mb-2 sticky top-0 bg-background/95 backdrop-blur z-10 flex justify-between items-center shrink-0">
                      <span>Kvartsfinal</span>
                      <span className="text-[9px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded font-black">4 Matcher</span>
                    </h4>
                    <div className="flex flex-col gap-3 overflow-y-auto max-h-[60vh] pr-1 scrollbar-thin">
                      {knockoutMatches
                        .filter((m) => m.stage === 'Quarter-final')
                        .sort((a, b) => parseInt(a.id) - parseInt(b.id))
                        .map((m) => (
                          <TreeNodeCard key={m.id} match={m} />
                        ))}
                    </div>
                  </div>
                )}

                {/* Semifinaler */}
                {knockoutMatches.filter((m) => m.stage === 'Semi-final').length > 0 && (
                  <div className="flex-shrink-0 w-[85vw] sm:w-[280px] snap-center flex flex-col gap-3">
                    <h4 className="text-xs font-black text-foreground uppercase border-b border-border pb-1.5 mb-2 sticky top-0 bg-background/95 backdrop-blur z-10 flex justify-between items-center shrink-0">
                      <span>Semifinal</span>
                      <span className="text-[9px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded font-black">2 Matcher</span>
                    </h4>
                    <div className="flex flex-col gap-3 overflow-y-auto max-h-[60vh] pr-1 scrollbar-thin">
                      {knockoutMatches
                        .filter((m) => m.stage === 'Semi-final')
                        .sort((a, b) => parseInt(a.id) - parseInt(b.id))
                        .map((m) => (
                          <TreeNodeCard key={m.id} match={m} />
                        ))}
                    </div>
                  </div>
                )}

                {/* Finaler */}
                {knockoutMatches.filter((m) => m.stage === 'Final' || m.stage === '3rd Place').length > 0 && (
                  <div className="flex-shrink-0 w-[85vw] sm:w-[280px] snap-center flex flex-col gap-3">
                    <h4 className="text-xs font-black text-foreground uppercase border-b border-border pb-1.5 mb-2 sticky top-0 bg-background/95 backdrop-blur z-10 flex justify-between items-center shrink-0">
                      <span>Finaler</span>
                      <span className="text-[9px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded font-black">Guld & Brons</span>
                    </h4>
                    <div className="flex flex-col gap-3 overflow-y-auto max-h-[60vh] pr-1 scrollbar-thin">
                      {knockoutMatches
                        .filter((m) => m.stage === 'Final' || m.stage === '3rd Place')
                        .sort((a, _b) => (a.stage === 'Final' ? 1 : -1))
                        .map((m) => (
                          <TreeNodeCard key={m.id} match={m} />
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-3 md:gap-4">
              {Object.keys(knockoutStages)
                .filter((stage) => activeKnockoutStages.includes(stage))
                .map((stage) => {
                  const stageOrder = [
                    'Round of 32',
                    'Round of 16',
                    'Quarter-final',
                    'Semi-final',
                    'Final',
                    '3rd Place',
                  ];
                  const stageIndex = stageOrder.indexOf(stage);

                  let isStageLocked = false;
                  let prevStageName = '';

                  if (stage === 'Final' || stage === '3rd Place') {
                    const prevStageMatches = knockoutStages['Semi-final'] || [];
                    isStageLocked =
                      prevStageMatches.length > 0 &&
                      !prevStageMatches.every((m) => m.isCompleted);
                    prevStageName = 'Semi-final';
                  } else if (stageIndex > 0) {
                    const prevStage = stageOrder[stageIndex - 1];
                    const prevStageMatches = knockoutStages[prevStage] || [];
                    isStageLocked =
                      prevStageMatches.length > 0 &&
                      !prevStageMatches.every((m) => m.isCompleted);
                    prevStageName = prevStage;
                  }

                  return (
                    <div
                      key={stage}
                      className="space-y-3 md:space-y-4 mb-6 md:mb-8"
                    >
                      <div className="flex items-center justify-between border-b border-border pb-1 md:pb-2">
                        <h3 className="text-xl md:text-2xl font-black text-foreground uppercase">
                          {STAGE_TRANSLATIONS[stage] || stage}
                        </h3>
                        {isStageLocked && (
                          <span className="text-[10px] md:text-xs font-black text-muted-foreground flex items-center gap-1">
                            <Lock size={12} /> Öppnar efter{' '}
                            {STAGE_TRANSLATIONS[prevStageName] || prevStageName}
                          </span>
                        )}
                      </div>

                      {isStageLocked ? (
                        <div className="text-center py-6 md:py-8 bg-secondary/20 text-muted-foreground border border-dashed border-border rounded-xl md:rounded-2xl flex flex-col items-center gap-2">
                          <Lock className="opacity-40 w-5 h-5" />
                          <p className="font-bold text-xs md:text-sm">
                            Låst tills föregående runda är färdigspelad.
                          </p>
                        </div>
                      ) : (
                        <div className={layout === 'grid' ? "grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid gap-3 md:gap-4"}>
                          {knockoutStages[stage].map((match) => (
                            <MatchCard
                              key={match.id}
                              match={match}
                              userBet={match.bets[0]}
                              isCompact={layout === 'grid'}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </section>
      ) : (
        <div className="text-center py-10 md:py-20 text-muted-foreground border border-dashed border-border rounded-xl md:rounded-2xl">
          Inga grupper inlästa ännu.
        </div>
      )}
    </div>
  );
}
