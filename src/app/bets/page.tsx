import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { STAGE_TRANSLATIONS, TEAM_TRANSLATIONS } from '@/lib/teams';
import BetsClient from './BetsClient';

export default async function BetsPage(props: {
  searchParams: Promise<{ group?: string; view?: string; stage?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const searchParams = await props.searchParams;
  const initialView = searchParams.view || 'group';
  const initialGroup = searchParams.group || null;
  const initialStage = searchParams.stage || 'r32';

  const [
    allMatches,
    groupBets,
    officialStandings,
    crystalQuestions,
    crystalBets,
  ] = await Promise.all([
    prisma.match.findMany({
      orderBy: { kickoff: 'asc' },
      include: {
        bets: { where: { userId: session.user.id } },
      },
    }),
    prisma.groupPlacementBet.findMany({
      where: { userId: session.user.id },
    }),
    prisma.officialGroupStanding.findMany(),
    prisma.sidebetQuestion.findMany({ orderBy: { points: 'desc' } }),
    prisma.userSidebet.findMany({ where: { userId: session.user.id } }),
  ]);

  const groupLockTimes: Record<string, Date> = {};
  for (const match of allMatches) {
    if (match.groupName && !groupLockTimes[match.groupName]) {
      groupLockTimes[match.groupName] = new Date(
        match.kickoff.getTime() - 60 * 60 * 1000
      );
    }
  }

  const groups: Record<string, Set<string>> = {};
  const knockoutMatches = [];

  for (const match of allMatches) {
    if (match.groupName && match.groupName !== 'TBD') {
      if (!groups[match.groupName]) groups[match.groupName] = new Set();
      groups[match.groupName].add(match.homeTeam);
      groups[match.groupName].add(match.awayTeam);
    } else if (!match.groupName) {
      knockoutMatches.push(match);
    }
  }

  const groupNames = Object.keys(groups).sort();

  const allTeams = Array.from(new Set(allMatches.flatMap(m => [m.homeTeam, m.awayTeam])))
    .map(englishName => {
      const info = STAGE_TRANSLATIONS[englishName] ? null : TEAM_TRANSLATIONS[englishName];
      if (!info) return null;
      return { english: englishName, swedish: info.name };
    })
    .filter((t): t is { english: string, swedish: string } => 
      t !== null && 
      !['TBD', '1A', '2A', '1B', '2B', '1C', '2C', '1D', '2D', '1E', '2E', '1F', '2F', '1G', '2G', '1H', '2H', '1I', '2I', '1J', '2J', '1K', '2K', '1L', '2L'].includes(t.english) && 
      !t.english.startsWith('W') && 
      !t.english.startsWith('L')
    )
    .sort((a, b) => a.swedish.localeCompare(b.swedish, 'sv'));

  const groupMatchesForLock = allMatches.filter(
    (m) => m.groupName && m.groupName !== 'TBD'
  );
  const isGroupStageFinished =
    groupMatchesForLock.length > 0 &&
    groupMatchesForLock.every((m) => m.isCompleted);

  const groupStatus: Record<string, 'completed' | 'started' | 'empty'> = {};
  for (const g of groupNames) {
    const gMatches = allMatches.filter((m) => m.groupName === g);
    const gMatchBets = gMatches.filter((m) => m.bets.length > 0);
    const gPlacementBets = groupBets.filter((b) => b.groupName === g);

    const hasAllMatchBets =
      gMatches.length > 0 && gMatchBets.length === gMatches.length;
    const hasPlacementBet = gPlacementBets.length === 4;

    if (hasAllMatchBets && hasPlacementBet) {
      groupStatus[g] = 'completed';
    } else if (gMatchBets.length > 0 || gPlacementBets.length > 0) {
      groupStatus[g] = 'started';
    } else {
      groupStatus[g] = 'empty';
    }
  }

  const knockoutStages: Record<string, typeof knockoutMatches> = {};
  for (const match of knockoutMatches) {
    if (!knockoutStages[match.stage]) knockoutStages[match.stage] = [];
    knockoutStages[match.stage].push(match);
  }

  const knockoutTabs = [
    { id: 'r32', label: '16-dels', stages: ['Round of 32'] },
    { id: 'r16', label: '8-dels', stages: ['Round of 16'] },
    { id: 'qf', label: 'Kvarts', stages: ['Quarter-final'] },
    { id: 'sf', label: 'Semi', stages: ['Semi-final'] },
    { id: 'finals', label: 'Finaler', stages: ['3rd Place', 'Final'] },
  ];

  return (
    <BetsClient 
      initialView={initialView}
      initialGroup={initialGroup}
      initialStage={initialStage}
      allMatches={allMatches}
      groupBets={groupBets}
      officialStandings={officialStandings}
      crystalQuestions={crystalQuestions}
      crystalBets={crystalBets}
      groupLockTimes={groupLockTimes}
      groups={groups}
      knockoutMatches={knockoutMatches}
      groupNames={groupNames}
      allTeams={allTeams}
      isGroupStageFinished={isGroupStageFinished}
      groupStatus={groupStatus}
      knockoutStages={knockoutStages}
      knockoutTabs={knockoutTabs}
    />
  );
}
