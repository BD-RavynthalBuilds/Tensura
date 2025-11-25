import { router } from 'expo-router';
import { ChevronLeft, Lock } from 'lucide-react-native';
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CHARACTERS, CHARACTER_CATEGORIES, getCharactersByCategory } from '@/constants/characters';
import { CHARACTER_UNLOCK_COSTS } from '@/constants/shop';
import { useGameState } from '@/contexts/GameStateContext';
import { CharacterId, CharacterCategory } from '@/types/game';

const { width } = Dimensions.get('window');
const GRID_ITEM_SIZE = 80;

const ELEMENT_COLORS = {
  water: '#00BFFF',
  fire: '#FF4500',
  storm: '#FFD700',
  darkness: '#8B00FF',
  light: '#FFFACD',
};

const RARITY_COLORS = {
  common: '#9E9E9E',
  rare: '#4169E1',
  epic: '#9370DB',
  legendary: '#FFD700',
};

export default function CharacterSelect() {
  const insets = useSafeAreaInsets();
  const { progress, isCharacterUnlocked } = useGameState();
  const [selectedCategory, setSelectedCategory] = useState<CharacterCategory>('Tensura');
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterId>(
    progress.unlockedCharacters[0] || 'rimuru'
  );

  const charactersInCategory = useMemo(() => {
    return getCharactersByCategory(selectedCategory);
  }, [selectedCategory]);

  const handleCharacterPress = (characterId: CharacterId) => {
    const isUnlocked = isCharacterUnlocked(characterId);
    if (!isUnlocked) {
      const cost = CHARACTER_UNLOCK_COSTS[characterId] || 0;
      Alert.alert('Character Locked', `Unlock ${CHARACTERS[characterId].name} in the Shop for ${cost} gems!`);
      return;
    }
    setSelectedCharacter(characterId);
  };

  const handleStartGame = () => {
    if (!isCharacterUnlocked(selectedCharacter)) {
      Alert.alert('Character Locked', 'Please select an unlocked character!');
      return;
    }
    router.push({ pathname: '/game' as any, params: { character: selectedCharacter } });
  };

  const character = CHARACTERS[selectedCharacter];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CHARACTER SELECT</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.content}>
        <View style={styles.leftPanel}>
          <ScrollView 
            style={styles.tabsContainer}
            showsVerticalScrollIndicator={false}
          >
            {CHARACTER_CATEGORIES.map((category) => {
              const categoryChars = getCharactersByCategory(category);
              const unlockedCount = categoryChars.filter(c => isCharacterUnlocked(c.id)).length;
              const totalCount = categoryChars.length;

              return (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.tab,
                    selectedCategory === category && styles.tabActive,
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      selectedCategory === category && styles.tabTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                  <Text style={styles.tabCount}>
                    {unlockedCount}/{totalCount}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <ScrollView 
            style={styles.characterGrid}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.characterGridContent}
          >
            {charactersInCategory.length > 0 ? (
              charactersInCategory.map((char) => {
                const isSelected = char.id === selectedCharacter;
                const isUnlocked = isCharacterUnlocked(char.id);

                return (
                  <TouchableOpacity
                    key={char.id}
                    style={[
                      styles.characterGridItem,
                      {
                        borderColor: isSelected 
                          ? RARITY_COLORS[char.rarity] 
                          : ELEMENT_COLORS[char.element] + '40',
                        backgroundColor: ELEMENT_COLORS[char.element] + '15',
                        opacity: isUnlocked ? 1 : 0.6,
                      },
                      isSelected && styles.characterGridItemSelected,
                    ]}
                    onPress={() => handleCharacterPress(char.id)}
                  >
                    <View style={styles.characterIconContainer}>
                      <Text style={styles.characterInitial}>{char.name.charAt(0)}</Text>
                    </View>
                    {!isUnlocked && (
                      <View style={styles.lockedBadge}>
                        <Lock size={16} color="#FFFFFF" />
                      </View>
                    )}
                    <Text 
                      style={styles.characterGridName} 
                      numberOfLines={1}
                    >
                      {char.name}
                    </Text>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyCategory}>
                <Text style={styles.emptyCategoryText}>
                  No characters in this category yet
                </Text>
              </View>
            )}
          </ScrollView>
        </View>

        <View style={styles.rightPanel}>
          <ScrollView 
            style={styles.detailsContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.characterHeader}>
              <View style={[
                styles.characterPortrait,
                { backgroundColor: ELEMENT_COLORS[character.element] + '20' }
              ]}>
                <Text style={styles.characterPortraitInitial}>
                  {character.name.charAt(0)}
                </Text>
              </View>
              
              <View style={styles.characterTitleInfo}>
                <Text style={[styles.characterName, { color: RARITY_COLORS[character.rarity] }]}>
                  {character.name}
                </Text>
                <Text style={styles.characterDescription}>{character.description}</Text>
                
                <View style={styles.badges}>
                  <View style={[styles.badge, { backgroundColor: ELEMENT_COLORS[character.element] + '30' }]}>
                    <Text style={[styles.badgeText, { color: ELEMENT_COLORS[character.element] }]}>
                      {character.element.toUpperCase()}
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: RARITY_COLORS[character.rarity] + '30' }]}>
                    <Text style={[styles.badgeText, { color: RARITY_COLORS[character.rarity] }]}>
                      {character.rarity.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>BASE STATS</Text>
              <View style={styles.statsGrid}>
                <StatRow label="HP" value={character.baseStats.hp} color="#FF4444" />
                <StatRow label="MP" value={character.baseStats.mp} color="#4444FF" />
                <StatRow label="POWER" value={character.baseStats.power} color="#FFD700" />
                <StatRow label="DEFENSE" value={character.baseStats.defense} color="#00DD00" />
                <StatRow label="SPEED" value={character.baseStats.speed} color="#00BFFF" />
                <StatRow label="RANGE" value={character.baseStats.range} color="#FF69B4" />
                {character.baseStats.critChance !== undefined && (
                  <StatRow label="CRIT" value={`${character.baseStats.critChance}%`} color="#FFD700" />
                )}
                {character.baseStats.attack !== undefined && (
                  <StatRow label="ATTACK" value={character.baseStats.attack} color="#FF4500" />
                )}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>EVOLUTION PATH</Text>
              {character.evolutions.map((evo, index) => (
                <View key={index} style={styles.evolutionItem}>
                  <View style={styles.evolutionHeader}>
                    <View style={[styles.evolutionBadge, { borderColor: ELEMENT_COLORS[character.element] }]}>
                      <Text style={styles.evolutionLevel}>{index}</Text>
                    </View>
                    <Text style={styles.evolutionName}>{evo.name}</Text>
                    <Text style={styles.evolutionMultiplier}>
                      ×{evo.statsMultiplier}
                    </Text>
                  </View>
                  {evo.lore && (
                    <Text style={styles.evolutionLore}>{evo.lore}</Text>
                  )}
                  {evo.benefits && (
                    <Text style={styles.evolutionBenefits}>
                      Benefits: {evo.benefits}
                    </Text>
                  )}
                  <Text style={styles.evolutionRequirements}>
                    Requirements: Level {evo.requirements.level}
                    {evo.requirements.kills ? ` • ${evo.requirements.kills} Kills` : ''}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ABILITIES</Text>
              {character.moves.map((move) => (
                <View key={move.id} style={styles.abilityItem}>
                  <View style={styles.abilityHeader}>
                    <Text style={[styles.abilityName, getAbilityColor(move.type)]}>
                      {move.name}
                    </Text>
                    <View style={[styles.abilityTypeBadge, getAbilityTypeBadgeStyle(move.type)]}>
                      <Text style={styles.abilityTypeText}>{move.type.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.abilityDescription}>{move.description}</Text>
                  <View style={styles.abilityStats}>
                    <Text style={styles.abilityStat}>Damage: {move.damage}</Text>
                    <Text style={styles.abilityStat}>Range: {move.range}</Text>
                    <Text style={styles.abilityStat}>MP: {move.mpCost}</Text>
                    <Text style={styles.abilityStat}>CD: {move.cooldown}s</Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
            <TouchableOpacity
              style={[
                styles.startButton,
                { backgroundColor: ELEMENT_COLORS[character.element] }
              ]}
              onPress={handleStartGame}
            >
              <Text style={styles.startButtonText}>START BATTLE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

function StatRow({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statValueContainer}>
        <View style={[styles.statDot, { backgroundColor: color }]} />
        <Text style={[styles.statValue, { color }]}>{value}</Text>
      </View>
    </View>
  );
}

function getAbilityColor(type: string) {
  const colors = {
    basic: { color: '#AAA' },
    charge: { color: '#4A9EFF' },
    special: { color: '#9D4EDD' },
    ultimate: { color: '#FFD700' },
  };
  return colors[type as keyof typeof colors] || colors.basic;
}

function getAbilityTypeBadgeStyle(type: string) {
  const styles = {
    basic: { backgroundColor: '#AAA30' },
    charge: { backgroundColor: '#4A9EFF30' },
    special: { backgroundColor: '#9D4EDD30' },
    ultimate: { backgroundColor: '#FFD70030' },
  };
  return styles[type as keyof typeof styles] || styles.basic;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0520',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1030',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  leftPanel: {
    width: width * 0.35,
    borderRightWidth: 1,
    borderRightColor: '#1a1030',
  },
  tabsContainer: {
    maxHeight: 180,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1030',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a103020',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#1a1030',
    borderLeftWidth: 3,
    borderLeftColor: '#FFD700',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#888',
    flex: 1,
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '900' as const,
  },
  tabCount: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#666',
    marginLeft: 8,
  },
  characterGrid: {
    flex: 1,
  },
  characterGridContent: {
    padding: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  characterGridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE + 20,
    margin: 4,
    borderRadius: 12,
    borderWidth: 2,
    padding: 6,
    alignItems: 'center',
  },
  characterGridItemSelected: {
    borderWidth: 3,
    transform: [{ scale: 1.05 }],
  },
  characterIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2a2050',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  characterInitial: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: '#FFFFFF',
  },
  lockedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    padding: 4,
  },
  characterGridName: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  emptyCategory: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyCategoryText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  rightPanel: {
    flex: 1,
  },
  detailsContainer: {
    flex: 1,
  },
  characterHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1030',
  },
  characterPortrait: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  characterPortraitInitial: {
    fontSize: 60,
    fontWeight: '900' as const,
    color: '#FFFFFF',
  },
  characterTitleInfo: {
    alignItems: 'center',
  },
  characterName: {
    fontSize: 24,
    fontWeight: '900' as const,
    textAlign: 'center',
    marginBottom: 4,
  },
  characterDescription: {
    fontSize: 14,
    color: '#AAA',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600' as const,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '900' as const,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1030',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: 1,
  },
  statsGrid: {
    gap: 10,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#AAA',
  },
  statValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '900' as const,
  },
  evolutionItem: {
    backgroundColor: '#1a1030',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  evolutionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  evolutionBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: '#2a2050',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  evolutionLevel: {
    fontSize: 14,
    fontWeight: '900' as const,
    color: '#FFFFFF',
  },
  evolutionName: {
    fontSize: 16,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    flex: 1,
  },
  evolutionMultiplier: {
    fontSize: 14,
    fontWeight: '900' as const,
    color: '#FFD700',
  },
  evolutionLore: {
    fontSize: 12,
    color: '#AAA',
    fontStyle: 'italic' as const,
    marginBottom: 4,
  },
  evolutionBenefits: {
    fontSize: 12,
    color: '#4A9EFF',
    marginBottom: 4,
    fontWeight: '600' as const,
  },
  evolutionRequirements: {
    fontSize: 11,
    color: '#888',
    fontWeight: '600' as const,
  },
  abilityItem: {
    backgroundColor: '#1a1030',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  abilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  abilityName: {
    fontSize: 16,
    fontWeight: '900' as const,
    flex: 1,
  },
  abilityTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  abilityTypeText: {
    fontSize: 10,
    fontWeight: '900' as const,
    color: '#FFFFFF',
  },
  abilityDescription: {
    fontSize: 13,
    color: '#AAA',
    marginBottom: 8,
    fontWeight: '600' as const,
  },
  abilityStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  abilityStat: {
    fontSize: 11,
    color: '#888',
    fontWeight: '700' as const,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#1a1030',
  },
  startButton: {
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
});
