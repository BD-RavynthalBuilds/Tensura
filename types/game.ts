export type CharacterId = 'rimuru' | 'benimaru' | 'milim' | 'shion' | 'diablo' | 'veldora' | 'shuna' | 'ranga' | 'gobta' | 'souei' | 'hakurou' | 'ifrit' | 'charybdis' | 'guy_crimson' | 'testarossa' | 'ultima';

export type CharacterCategory = 
  | 'Tensura'
  | 'Dragons'
  | 'True Dragons'
  | 'Demons'
  | 'Angels'
  | 'Primordials'
  | 'Demi-Human'
  | 'Human (Hero Class)'
  | 'Arch-Angels'
  | 'Evolved Species';

export interface Character {
  id: CharacterId;
  name: string;
  description: string;
  baseStats: CharacterStats;
  evolutions: Evolution[];
  moves: Move[];
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  element: 'water' | 'fire' | 'storm' | 'darkness' | 'light';
  category?: CharacterCategory;
}

export interface CharacterStats {
  hp: number;
  mp: number;
  speed: number;
  power: number;
  defense: number;
  range: number;
  critChance?: number;
  attack?: number;
}

export interface Evolution {
  name: string;
  level: number;
  requirements: {
    level: number;
    kills?: number;
    items?: string[];
  };
  statsMultiplier: number;
  lore?: string;
  benefits?: string;
}

export interface Move {
  id: string;
  name: string;
  type: 'basic' | 'charge' | 'special' | 'ultimate';
  cooldown: number;
  damage: number;
  range: number;
  mpCost: number;
  description: string;
}

export interface Enemy {
  id: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  type: 'slime' | 'wolf' | 'orc' | 'goblin';
  size: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'aura' | 'hit' | 'trail';
}

export interface GameState {
  playerX: number;
  playerY: number;
  playerHp: number;
  playerMaxHp: number;
  playerMp: number;
  playerMaxMp: number;
  playerLevel: number;
  playerXp: number;
  playerXpToNext: number;
  kills: number;
  selectedCharacter: CharacterId;
  currentEvolution: number;
  enemies: Enemy[];
  particles: Particle[];
  isPaused: boolean;
  gameTime: number;
}

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  type: 'stat' | 'passive' | 'ability';
  cost: number;
  level: number;
  maxLevel: number;
  effect: {
    hpBonus?: number;
    mpBonus?: number;
    powerBonus?: number;
    defenseBonus?: number;
    speedBonus?: number;
    rangeBonus?: number;
  };
}

export interface Artifact {
  id: string;
  name: string;
  description: string;
  cost: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  effect: string;
}

export interface PlayerProgress {
  gems: number;
  lives: number;
  maxLives: number;
  unlockedCharacters: CharacterId[];
  purchasedUpgrades: Record<string, number>;
  ownedArtifacts: string[];
  highestStage: number;
  currentStage: number;
  currentRound: number;
  savePoints: Record<number, SavePoint>;
}

export interface SavePoint {
  stage: number;
  round: number;
  timestamp: number;
  gems: number;
  lives: number;
}

export interface StageInfo {
  stage: number;
  round: number;
  timeRemaining: number;
  maxTime: number;
  enemyLevel: number;
}
