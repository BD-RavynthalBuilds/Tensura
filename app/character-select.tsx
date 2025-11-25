import { router } from 'expo-router';
import { ChevronLeft, Flame, Droplet, Zap, Lock, Gem } from 'lucide-react-native';
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CHARACTERS } from '@/constants/characters';
import { CHARACTER_UNLOCK_COSTS } from '@/constants/shop';
import { useGameState } from '@/contexts/GameStateContext';
import { CharacterId } from '@/types/game';

const { width } = Dimensions.get('window');

const ELEMENT_ICONS = {
  water: Droplet,
  fire: Flame,
  storm: Zap,
  darkness: null,
  light: null,
};

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
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterId>(
    progress.unlockedCharacters[0] || 'rimuru'
  );
  const scaleAnims = useRef<Record<string, Animated.Value>>(
    Object.keys(CHARACTERS).reduce((acc, key) => {
      acc[key] = new Animated.Value(1);
      return acc;
    }, {} as Record<string, Animated.Value>)
  ).current;

  const handleCharacterPress = (characterId: CharacterId) => {
    if (!isCharacterUnlocked(characterId)) {
      const cost = CHARACTER_UNLOCK_COSTS[characterId];
      Alert.alert('Character Locked', `Unlock ${CHARACTERS[characterId].name} in the Shop for ${cost} gems!`);
      return;
    }
    setSelectedCharacter(characterId);
    Animated.sequence([
      Animated.timing(scaleAnims[characterId], {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnims[characterId], {
        toValue: 1,
        tension: 100,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleStartGame = () => {
    if (!isCharacterUnlocked(selectedCharacter)) {
      Alert.alert('Character Locked', 'Please select an unlocked character!');
      return;
    }
    router.push({ pathname: '/game' as any, params: { character: selectedCharacter } });
  };

  const character = CHARACTERS[selectedCharacter];
  const ElementIcon = ELEMENT_ICONS[character.element];
  const elementColor = ELEMENT_COLORS[character.element];
  const rarityColor = RARITY_COLORS[character.rarity];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SELECT CHARACTER</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.characterList}
        snapToInterval={width * 0.7 + 20}
        decelerationRate="fast"
      >
        {Object.values(CHARACTERS).map((char) => {
          const isSelected = char.id === selectedCharacter;
          const isUnlocked = isCharacterUnlocked(char.id);
          const cost = CHARACTER_UNLOCK_COSTS[char.id];
          return (
            <TouchableOpacity
              key={char.id}
              onPress={() => handleCharacterPress(char.id)}
              activeOpacity={0.8}
            >
              <Animated.View
                style={[
                  styles.characterCard,
                  {
                    borderColor: isSelected ? rarityColor : '#444',
                    transform: [{ scale: scaleAnims[char.id] }],
                    opacity: isUnlocked ? 1 : 0.5,
                  },
                ]}
              >
                <View style={[styles.characterPortrait, { backgroundColor: ELEMENT_COLORS[char.element] + '20' }]}>
                  <View style={styles.characterIconPlaceholder}>
                    <Text style={styles.characterInitial}>{char.name.charAt(0)}</Text>
                  </View>
                  {!isUnlocked && (
                    <View style={styles.lockedOverlay}>
                      <Lock size={32} color="#FFFFFF" />
                      {cost > 0 && (
                        <View style={styles.lockCost}>
                          <Gem size={16} color="#FFD700" fill="#FFD700" />
                          <Text style={styles.lockCostText}>{cost}</Text>
                        </View>
                      )}
                    </View>
                  )}
                  {isSelected && isUnlocked && (
                    <View style={[styles.selectedBadge, { backgroundColor: rarityColor }]}>
                      <Text style={styles.selectedText}>SELECTED</Text>
                    </View>
                  )}
                </View>
                <View style={styles.characterInfo}>
                  <Text style={[styles.characterName, { color: rarityColor }]}>{char.name}</Text>
                  <Text style={styles.characterDescription}>{char.description}</Text>
                </View>
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.detailsPanel}>
        <View style={styles.detailsHeader}>
          <View style={styles.elementBadge}>
            {ElementIcon && <ElementIcon size={20} color={elementColor} fill={elementColor} />}
            <Text style={[styles.elementText, { color: elementColor }]}>
              {character.element.toUpperCase()}
            </Text>
          </View>
          <View style={[styles.rarityBadge, { backgroundColor: rarityColor + '30' }]}>
            <Text style={[styles.rarityText, { color: rarityColor }]}>
              {character.rarity.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>BASE STATS</Text>
          <View style={styles.statsGrid}>
            <StatBar label="HP" value={character.baseStats.hp} max={200} color="#FF4444" />
            <StatBar label="MP" value={character.baseStats.mp} max={200} color="#4444FF" />
            <StatBar label="POWER" value={character.baseStats.power} max={50} color="#FFD700" />
            <StatBar label="DEFENSE" value={character.baseStats.defense} max={50} color="#00DD00" />
            <StatBar label="SPEED" value={character.baseStats.speed} max={10} color="#00BFFF" />
            <StatBar label="RANGE" value={character.baseStats.range} max={500} color="#FF69B4" />
          </View>
        </View>

        <View style={styles.evolutionPreview}>
          <Text style={styles.evolutionTitle}>EVOLUTIONS</Text>
          <View style={styles.evolutionChain}>
            {character.evolutions.map((evo, index) => (
              <View key={index} style={styles.evolutionStep}>
                <View style={[styles.evolutionNode, { borderColor: elementColor }]}>
                  <Text style={styles.evolutionLevel}>{index + 1}</Text>
                </View>
                <Text style={styles.evolutionName}>{evo.name}</Text>
                {index < character.evolutions.length - 1 && (
                  <View style={[styles.evolutionArrow, { backgroundColor: elementColor }]} />
                )}
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity style={[styles.startButton, { backgroundColor: elementColor }]} onPress={handleStartGame}>
          <Text style={styles.startButtonText}>START BATTLE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const percentage = (value / max) * 100;
  return (
    <View style={styles.statBar}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statBarContainer}>
        <View style={[styles.statBarFill, { width: `${percentage}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
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
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  characterList: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 20,
  },
  characterCard: {
    width: width * 0.7,
    backgroundColor: '#1a1030',
    borderRadius: 20,
    borderWidth: 3,
    overflow: 'hidden',
  },
  characterPortrait: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  characterIconPlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#2a2050',
    alignItems: 'center',
    justifyContent: 'center',
  },
  characterInitial: {
    fontSize: 72,
    fontWeight: '900' as const,
    color: '#FFFFFF',
  },
  selectedBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  selectedText: {
    fontSize: 12,
    fontWeight: '900' as const,
    color: '#FFFFFF',
  },
  characterInfo: {
    padding: 16,
  },
  characterName: {
    fontSize: 24,
    fontWeight: '900' as const,
    marginBottom: 4,
  },
  characterDescription: {
    fontSize: 14,
    color: '#AAA',
    fontWeight: '600' as const,
  },
  detailsPanel: {
    backgroundColor: '#150a30',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    marginTop: 10,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  elementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1a1030',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  elementText: {
    fontSize: 14,
    fontWeight: '900' as const,
  },
  rarityBadge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  rarityText: {
    fontSize: 14,
    fontWeight: '900' as const,
  },
  statsContainer: {
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: 1,
  },
  statsGrid: {
    gap: 8,
  },
  statBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#AAA',
    width: 70,
  },
  statBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#2a2050',
    borderRadius: 4,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    width: 40,
    textAlign: 'right',
  },
  evolutionPreview: {
    marginBottom: 10,
  },
  evolutionTitle: {
    fontSize: 16,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: 1,
  },
  evolutionChain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  evolutionStep: {
    alignItems: 'center',
    flex: 1,
  },
  evolutionNode: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    backgroundColor: '#2a2050',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  evolutionLevel: {
    fontSize: 16,
    fontWeight: '900' as const,
    color: '#FFFFFF',
  },
  evolutionName: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#AAA',
    textAlign: 'center',
  },
  evolutionArrow: {
    position: 'absolute',
    top: 18,
    right: -10,
    width: 20,
    height: 4,
    borderRadius: 2,
  },
  footer: {
    paddingHorizontal: 20,
  },
  startButton: {
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 20,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockCost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  lockCostText: {
    fontSize: 14,
    fontWeight: '900' as const,
    color: '#FFD700',
  },
});
