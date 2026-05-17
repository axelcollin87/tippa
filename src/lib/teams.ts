export const STAGE_TRANSLATIONS: Record<string, string> = {
  'Round of 32': 'Sextondelsfinal',
  'Round of 16': 'Åttondelsfinal',
  'Quarter-final': 'Kvartsfinal',
  'Semi-final': 'Semifinal',
  'Match for third place': 'Bronsmatch',
  '3rd Place': 'Bronsmatch',
  'Final': 'Final'
};

export const TEAM_TRANSLATIONS: Record<string, { name: string; code: string }> =

  {
    'Algeria': { name: 'Algeriet', code: 'DZ' },
    'Argentina': { name: 'Argentina', code: 'AR' },
    'Australia': { name: 'Australien', code: 'AU' },
    'Austria': { name: 'Österrike', code: 'AT' },
    'Belgium': { name: 'Belgien', code: 'BE' },
    'Bosnia & Herzegovina': { name: 'Bosnien & Herc.', code: 'BA' },
    'Brazil': { name: 'Brasilien', code: 'BR' },
    'Canada': { name: 'Kanada', code: 'CA' },
    'Cape Verde': { name: 'Kap Verde', code: 'CV' },
    'Chile': { name: 'Chile', code: 'CL' },
    'Colombia': { name: 'Colombia', code: 'CO' },
    'Costa Rica': { name: 'Costa Rica', code: 'CR' },
    'Croatia': { name: 'Kroatien', code: 'HR' },
    'Curaçao': { name: 'Curaçao', code: 'CW' },
    'Czech Republic': { name: 'Tjeckien', code: 'CZ' },
    'Denmark': { name: 'Danmark', code: 'DK' },
    'DR Congo': { name: 'DR Kongo', code: 'CD' },
    'Ecuador': { name: 'Ecuador', code: 'EC' },
    'Egypt': { name: 'Egypten', code: 'EG' },
    'England': { name: 'England', code: 'GB-ENG' },
    'France': { name: 'Frankrike', code: 'FR' },
    'Germany': { name: 'Tyskland', code: 'DE' },
    'Ghana': { name: 'Ghana', code: 'GH' },
    'Greece': { name: 'Grekland', code: 'GR' },
    'Haiti': { name: 'Haiti', code: 'HT' },
    'Hungary': { name: 'Ungern', code: 'HU' },
    'Iceland': { name: 'Island', code: 'IS' },
    'Iran': { name: 'Iran', code: 'IR' },
    'Iraq': { name: 'Irak', code: 'IQ' },
    'Italy': { name: 'Italien', code: 'IT' },
    'Ivory Coast': { name: 'Elfenbenskusten', code: 'CI' },
    'Jamaica': { name: 'Jamaica', code: 'JM' },
    'Japan': { name: 'Japan', code: 'JP' },
    'Jordan': { name: 'Jordanien', code: 'JO' },
    'Mexico': { name: 'Mexiko', code: 'MX' },
    'Morocco': { name: 'Marocko', code: 'MA' },
    'Netherlands': { name: 'Nederländerna', code: 'NL' },
    'New Zealand': { name: 'Nya Zeeland', code: 'NZ' },
    'Nigeria': { name: 'Nigeria', code: 'NG' },
    'Norway': { name: 'Norge', code: 'NO' },
    'Panama': { name: 'Panama', code: 'PA' },
    'Paraguay': { name: 'Paraguay', code: 'PY' },
    'Peru': { name: 'Peru', code: 'PE' },
    'Poland': { name: 'Polen', code: 'PL' },
    'Portugal': { name: 'Portugal', code: 'PT' },
    'Qatar': { name: 'Qatar', code: 'QA' },
    'Saudi Arabia': { name: 'Saudiarabien', code: 'SA' },
    'Scotland': { name: 'Skottland', code: 'GB-SCT' },
    'Senegal': { name: 'Senegal', code: 'SN' },
    'Serbia': { name: 'Serbien', code: 'RS' },
    'South Africa': { name: 'Sydafrika', code: 'ZA' },
    'South Korea': { name: 'Sydkorea', code: 'KR' },
    'Spain': { name: 'Spanien', code: 'ES' },
    'Sweden': { name: 'Sverige', code: 'SE' },
    'Switzerland': { name: 'Schweiz', code: 'CH' },
    'Tunisia': { name: 'Tunisien', code: 'TN' },
    'Turkey': { name: 'Turkiet', code: 'TR' },
    'Ukraine': { name: 'Ukraina', code: 'UA' },
    'USA': { name: 'USA', code: 'US' },
    'Uruguay': { name: 'Uruguay', code: 'UY' },
    'Uzbekistan': { name: 'Uzbekistan', code: 'UZ' },
    'Wales': { name: 'Wales', code: 'GB-WLS' },
  };

/**
 * Hjälpfunktion för att hämta svenskt namn och flagga.
 */
export function getTeamInfo(englishName: string) {
  const translation = TEAM_TRANSLATIONS[englishName];

  if (translation) {
    const code = translation.code.toLowerCase();

    // FlagCDN expects exactly 'gb-eng', 'gb-wls', 'gb-sct' for UK nations.
    // For standard ISO codes (e.g., 'US', 'SE'), it just wants 'us', 'se'.
    let flagCode = code;
    if (!code.startsWith('gb-')) {
      // Only split if it's not a GB nation, in case we accidentally added a prefix somewhere else
      flagCode = code.includes('-') ? code.split('-')[1] : code;
    }

    return {
      name: translation.name,
      flagUrl: `https://flagcdn.com/w40/${flagCode}.png`,
    };
  }

  // Om vi inte har en översättning (t.ex. för "Winner Group A")
  return {
    name: englishName,
    flagUrl: null,
  };
}
