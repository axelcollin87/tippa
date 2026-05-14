export const SPORTMONKS_BASE_URL = "https://api.sportmonks.com/v3/football";
export const WC2026_SEASON_ID = 26618;

/**
 * Hämtar alla matcher för VM 2026.
 * Utan "include" för att stödja grundläggande API-planer.
 */
export async function fetchWorldCupFixtures() {
  const token = process.env.SPORTMONKS_API_TOKEN;
  if (!token) throw new Error("SPORTMONKS_API_TOKEN saknas i .env");

  const response = await fetch(
    `${SPORTMONKS_BASE_URL}/schedules/seasons/${WC2026_SEASON_ID}?api_token=${token}`,
    { next: { revalidate: 86400 } } 
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Sportmonks API Error: ${errorData.message || response.statusText}`);
  }

  const data = await response.json();
  return data.data;
}
