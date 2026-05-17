'use client';

import { useState } from 'react';
import GroupRanking from '@/components/GroupRanking';
import Countdown from '@/components/Countdown';
import InfoPopover from '@/components/InfoPopover';
import { Lock } from 'lucide-react';
import { STAGE_TRANSLATIONS } from '@/lib/teams';
import MatchCard from '@/components/MatchCard';
import CrystalBallQuestion from './CrystalBallQuestion';

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
}: BetsClientProps) {
  const [view, setView] = useState(initialView);
  const [activeGroup, setActiveGroup] = useState<string | null>(
    initialGroup || groupNames[0] || 'A'
  );
  const [activeKnockoutStageId, setActiveKnockoutStageId] =
    useState(initialStage);

  const isKnockoutView = view === 'knockout';
  const isCrystalBallView = view === 'crystalball';

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
          <p className="text-muted-foreground mt-1 text-[11px] md:text-sm">
            Klicka på en den grupp du vill tippa eller se resultat för.
          </p>
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
                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full font-black text-[9px] md:text-xs transition-all uppercase tracking-tighter border-2 ${statusBorder} ${
                  activeGroup === g && !isCrystalBallView && !isKnockoutView
                    ? 'bg-primary/80 text-background scale-105 border-primary shadow-[0_0_15px_rgba(var(--primary),0.4)]'
                    : 'bg-card text-muted-foreground hover:bg-secondary'
                }`}
              >
                Grupp {g}
              </button>
            );
          })}

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
              else
                statusBorder = 'border-border opacity-50';

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
          <div className="bg-primary/5 p-6 rounded-3xl border border-primary/20">
            <h1 className="text-2xl md:text-4xl font-black text-primary uppercase tracking-widest flex items-center gap-3">
              <span>🏆</span> TOPP 3 I VM
            </h1>
            <p className="text-muted-foreground mt-2 text-xs md:text-sm max-w-2xl">
              Vem tror du kniper medaljerna? Dessa val måste göras innan första
              matchen i VM blåses igång.
            </p>
          </div>

          {crystalQuestions.length > 0 ? (
            <div className="grid gap-4 md:gap-6 md:grid-cols-3">
              {crystalQuestions.map((q) => {
                const bet = crystalBets.find((b) => b.questionId === q.id);
                return (
                  <CrystalBallQuestion
                    key={q.id}
                    question={q}
                    userBet={bet}
                    allTeams={allTeams}
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
                    {new Date() < groupLockTimes[activeGroup] ? (
                      <Countdown
                        targetDate={groupLockTimes[activeGroup]}
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
                activeGroup ? new Date() > groupLockTimes[activeGroup] : false
              }
              officialStandings={activeOfficialStandings}
            />
          </section>

          <section className="space-y-4 md:space-y-6 pt-2 md:pt-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg md:text-xl font-black text-foreground uppercase tracking-widest">
                Matcher
              </h2>
              <span className="text-[9px] md:text-[10px] font-black bg-secondary text-muted-foreground px-2 py-1 rounded">
                100p maxpoäng
              </span>
            </div>
            <div className="grid gap-3 md:gap-4">
              {activeMatches.map((match) => (
                <div
                  key={match.id}
                  id={`match-${match.id}`}
                  className="scroll-mt-24"
                >
                  <MatchCard match={match} userBet={match.bets[0]} />
                </div>
              ))}
            </div>
          </section>
        </>
      ) : isKnockoutView ? (
        <section className="space-y-4 md:space-y-6">
          <div className="">
            <div>
              <h1 className="text-2xl md:text-4xl font-black text-primary uppercase tracking-widest">
                SLUTSPEL
              </h1>
            </div>
          </div>

          {!isGroupStageFinished ? (
            <div className="text-center py-10 md:py-20 text-muted-foreground border border-dashed border-border rounded-xl md:rounded-2xl flex flex-col items-center gap-3">
              <Lock className="text-muted-foreground opacity-50 w-6 h-6 md:w-8 md:h-8" />
              <p className="font-bold text-sm">
                Denna del öppnar när hela gruppspelet är avslutat.
              </p>
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
                        knockoutStages[stage].map((match) => (
                          <MatchCard
                            key={match.id}
                            match={match}
                            userBet={match.bets[0]}
                          />
                        ))
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
