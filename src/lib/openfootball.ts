export const OPENFOOTBALL_URL = "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

export interface OpenFootballMatch {
  round: string;
  date: string;
  time: string;
  team1: string;
  team2: string;
  group?: string;
  num?: number;
  ground?: string;
}

export async function fetchWorldCupData() {
  const response = await fetch(OPENFOOTBALL_URL, { next: { revalidate: 3600 } }); // Cacha i 1 timme
  if (!response.ok) {
    throw new Error(`Kunde inte hämta data från GitHub: ${response.statusText}`);
  }
  const data = await response.json();
  return data.matches as OpenFootballMatch[];
}
