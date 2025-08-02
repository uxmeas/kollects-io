// NFL All Day player and team data
// This is a simplified mapping for demonstration purposes
// In production, you'd fetch this from the AllDay API or on-chain metadata

export interface PlayerData {
  name: string;
  position: string;
  team: string;
}

export interface PlayData {
  id: string;
  player: PlayerData;
  playType: string;
  description: string;
  series: string;
  season: string;
  imageUrl?: string;
}

// Sample play data mapping (playID -> play info)
export const PLAY_DATA: Record<string, PlayData> = {
  // Common plays - these are examples
  "1": {
    id: "1",
    player: { name: "Patrick Mahomes", position: "QB", team: "Kansas City Chiefs" },
    playType: "Passing TD",
    description: "41-yard touchdown pass",
    series: "Series 1",
    season: "2022"
  },
  "2": {
    id: "2", 
    player: { name: "Josh Allen", position: "QB", team: "Buffalo Bills" },
    playType: "Rushing TD",
    description: "15-yard rushing touchdown",
    series: "Series 1",
    season: "2022"
  },
  "3": {
    id: "3",
    player: { name: "Justin Jefferson", position: "WR", team: "Minnesota Vikings" },
    playType: "Receiving TD",
    description: "64-yard receiving touchdown",
    series: "Series 2",
    season: "2022"
  },
  "4": {
    id: "4",
    player: { name: "Derrick Henry", position: "RB", team: "Tennessee Titans" },
    playType: "Rushing TD",
    description: "76-yard rushing touchdown",
    series: "Series 1",
    season: "2022"
  },
  "5": {
    id: "5",
    player: { name: "Davante Adams", position: "WR", team: "Las Vegas Raiders" },
    playType: "Receiving TD",
    description: "38-yard receiving touchdown",
    series: "Series 2",
    season: "2022"
  }
};

// Helper function to get play data
export function getPlayData(playID: string): PlayData | undefined {
  return PLAY_DATA[playID];
}

// Generate AllDay platform URL
export function getAllDayUrl(momentId: string): string {
  return `https://nflallday.com/moments/${momentId}`;
}

// Generate purchase date (random date in the past 2 years)
export function generatePurchaseDate(momentId: string): string {
  const seed = parseInt(momentId);
  const daysAgo = (seed % 730) + 30; // 30-760 days ago
  const purchaseDate = new Date();
  purchaseDate.setDate(purchaseDate.getDate() - daysAgo);
  return purchaseDate.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

// Random player names for unknown plays
const PLAYER_NAMES = [
  "Lamar Jackson", "Aaron Rodgers", "Dak Prescott", "Russell Wilson",
  "Stefon Diggs", "Tyreek Hill", "Cooper Kupp", "A.J. Brown",
  "Christian McCaffrey", "Alvin Kamara", "Nick Chubb", "Saquon Barkley",
  "T.J. Watt", "Aaron Donald", "Myles Garrett", "Khalil Mack"
];

const TEAMS = [
  "Baltimore Ravens", "Green Bay Packers", "Dallas Cowboys", "Denver Broncos",
  "Buffalo Bills", "Miami Dolphins", "Los Angeles Rams", "Philadelphia Eagles",
  "San Francisco 49ers", "New Orleans Saints", "Cleveland Browns", "New York Giants",
  "Pittsburgh Steelers", "Los Angeles Rams", "Cleveland Browns", "Los Angeles Chargers"
];

// Generate placeholder data for unknown plays
export function generatePlaceholderPlayData(playID: string): PlayData {
  const playerIndex = parseInt(playID) % PLAYER_NAMES.length;
  const teamIndex = parseInt(playID) % TEAMS.length;
  
  return {
    id: playID,
    player: {
      name: PLAYER_NAMES[playerIndex] || "NFL Player",
      position: ["QB", "RB", "WR", "TE", "DEF"][parseInt(playID) % 5],
      team: TEAMS[teamIndex] || "NFL Team"
    },
    playType: ["Rushing TD", "Passing TD", "Receiving TD", "Defensive Play", "Special Teams"][parseInt(playID) % 5],
    description: "NFL All Day Moment",
    series: `Series ${(parseInt(playID) % 10) + 1}`,
    season: "2022-2023",
    imageUrl: `https://assets.nflallday.com/moments/play_${playID}_thumbnail.jpg`
  };
}

// Generate random purchase price for demo (higher values to match real data)
export function generatePurchasePrice(momentId: string): number {
  // Generate consistent prices based on momentId
  // Range from $20 to $5000 to simulate real purchase prices
  const base = parseInt(momentId) % 200;
  const multiplier = (parseInt(momentId) % 20) + 5;
  const price = (base * multiplier) + (Math.floor(parseInt(momentId) / 1000) * 50);
  return Math.max(20, price);
}

// Generate current market price (generally lower to show typical losses)
export function generateMarketPrice(momentId: string): number {
  const purchasePrice = generatePurchasePrice(momentId);
  // Most NFTs have lost value, so bias towards losses
  const variance = (parseInt(momentId) % 100) - 80; // -80 to +20 variance
  const percentChange = 1 + (variance / 100);
  return Math.max(5, Math.round(purchasePrice * percentChange));
}