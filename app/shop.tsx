import { router } from 'expo-router';
import { ChevronLeft, Gem, TrendingUp, Sparkles, Users, Lock } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CHARACTERS } from '@/constants/characters';
import { UPGRADES, ARTIFACTS, CHARACTER_UNLOCK_COSTS } from '@/constants/shop';
import { useGameState } from '@/contexts/GameStateContext';

type TabType = 'upgrades' | 'artifacts' | 'characters' | 'lives';

export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const [selectedTab, setSelectedTab] = useState<TabType>('upgrades');
  const gameState = useGameState();
  const { progress, spendGems, unlockCharacter, purchaseUpgrade, purchaseArtifact, increaseMaxLives } = gameState;

  const handleUpgradePurchase = (upgradeId: string) => {
    const upgrade = UPGRADES[upgradeId];
    const currentLevel = progress.purchasedUpgrades[upgradeId] || 0;
    if (currentLevel >= upgrade.maxLevel) {
      Alert.alert('Max Level', 'This upgrade is already at maximum level!');
      return;
    }
    const cost = upgrade.cost * (currentLevel + 1);
    if (progress.gems >= cost) {
      if (spendGems(cost)) {
        purchaseUpgrade(upgradeId);
        Alert.alert('Upgrade Purchased!', `${upgrade.name} upgraded to level ${currentLevel + 1}`);
      }
    } else {
      Alert.alert('Not Enough Gems', `You need ${cost} gems to purchase this upgrade.`);
    }
  };

  const handleArtifactPurchase = (artifactId: string) => {
    const artifact = ARTIFACTS[artifactId];
    if (progress.ownedArtifacts.includes(artifactId)) {
      Alert.alert('Already Owned', 'You already own this artifact!');
      return;
    }
    if (progress.gems >= artifact.cost) {
      if (spendGems(artifact.cost)) {
        purchaseArtifact(artifactId);
        Alert.alert('Artifact Purchased!', `${artifact.name} added to your collection!`);
      }
    } else {
      Alert.alert('Not Enough Gems', `You need ${artifact.cost} gems to purchase this artifact.`);
    }
  };

  const handleCharacterUnlock = (characterId: string) => {
    if (progress.unlockedCharacters.includes(characterId as any)) {
      Alert.alert('Already Unlocked', 'You already have this character!');
      return;
    }
    const cost = CHARACTER_UNLOCK_COSTS[characterId];
    if (cost === 0) return;
    if (progress.gems >= cost) {
      if (spendGems(cost)) {
        unlockCharacter(characterId as any);
        Alert.alert('Character Unlocked!', `${CHARACTERS[characterId].name} is now available!`);
      }
    } else {
      Alert.alert('Not Enough Gems', `You need ${cost} gems to unlock this character.`);
    }
  };

  const handleLifePurchase = () => {
    const cost = 200;
    if (progress.gems >= cost) {
      if (spendGems(cost)) {
        increaseMaxLives();
        Alert.alert('Life Purchased!', `Max lives increased to ${progress.maxLives + 1}!`);
      }
    } else {
      Alert.alert('Not Enough Gems', `You need ${cost} gems to purchase a life.`);
    }
  };

  const renderUpgrades = () => (
    <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.itemsGrid}>
        {Object.values(UPGRADES).map((upgrade) => {
          const currentLevel = progress.purchasedUpgrades[upgrade.id] || 0;
          const cost = upgrade.cost * (currentLevel + 1);
          const isMaxed = currentLevel >= upgrade.maxLevel;
          return (
            <TouchableOpacity
              key={upgrade.id}
              style={[styles.upgradeCard, isMaxed && styles.maxedCard]}
              onPress={() => !isMaxed && handleUpgradePurchase(upgrade.id)}
              disabled={isMaxed}
            >
              <View style={styles.upgradeHeader}>
                <Text style={styles.upgradeName}>{upgrade.name}</Text>
                <Text style={styles.upgradeLevel}>
                  Lv {currentLevel}/{upgrade.maxLevel}
                </Text>
              </View>
              <Text style={styles.upgradeDescription}>{upgrade.description}</Text>
              <Text style={styles.upgradeEffect}>
                {Object.entries(upgrade.effect).map(([key, value]) => (
                  `+${value} ${key.replace('Bonus', '')}`
                )).join(', ')}
              </Text>
              <View style={styles.upgradeCostContainer}>
                <Gem size={16} color={isMaxed ? '#666' : '#FFD700'} fill={isMaxed ? '#666' : '#FFD700'} />
                <Text style={[styles.upgradeCost, isMaxed && styles.maxedText]}>
                  {isMaxed ? 'MAXED' : cost}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );

  const renderArtifacts = () => (
    <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.itemsGrid}>
        {Object.values(ARTIFACTS).map((artifact) => {
          const isOwned = progress.ownedArtifacts.includes(artifact.id);
          const rarityColor = {
            common: '#9E9E9E',
            rare: '#4169E1',
            epic: '#9370DB',
            legendary: '#FFD700',
          }[artifact.rarity];
          return (
            <TouchableOpacity
              key={artifact.id}
              style={[styles.artifactCard, { borderColor: rarityColor }, isOwned && styles.ownedCard]}
              onPress={() => !isOwned && handleArtifactPurchase(artifact.id)}
              disabled={isOwned}
            >
              <View style={styles.artifactHeader}>
                <Text style={[styles.artifactName, { color: rarityColor }]}>{artifact.name}</Text>
                {isOwned && <Text style={styles.ownedBadge}>OWNED</Text>}
              </View>
              <Text style={styles.artifactRarity}>{artifact.rarity.toUpperCase()}</Text>
              <Text style={styles.artifactDescription}>{artifact.description}</Text>
              <Text style={styles.artifactEffect}>{artifact.effect}</Text>
              <View style={styles.artifactCostContainer}>
                <Gem size={18} color={isOwned ? '#666' : '#FFD700'} fill={isOwned ? '#666' : '#FFD700'} />
                <Text style={[styles.artifactCost, isOwned && styles.ownedText]}>
                  {isOwned ? 'OWNED' : artifact.cost}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );

  const renderCharacters = () => (
    <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.charactersGrid}>
        {Object.values(CHARACTERS).map((character) => {
          const isUnlocked = progress.unlockedCharacters.includes(character.id);
          const cost = CHARACTER_UNLOCK_COSTS[character.id];
          const isFree = cost === 0;
          const rarityColor = {
            common: '#9E9E9E',
            rare: '#4169E1',
            epic: '#9370DB',
            legendary: '#FFD700',
          }[character.rarity];
          return (
            <TouchableOpacity
              key={character.id}
              style={[styles.characterCard, { borderColor: rarityColor }, isUnlocked && styles.unlockedCard]}
              onPress={() => !isUnlocked && !isFree && handleCharacterUnlock(character.id)}
              disabled={isUnlocked || isFree}
            >
              <View style={[styles.characterPortrait, { backgroundColor: rarityColor + '20' }]}>
                <Text style={styles.characterInitial}>{character.name.charAt(0)}</Text>
                {!isUnlocked && !isFree && (
                  <View style={styles.lockedOverlay}>
                    <Lock size={32} color="#FFFFFF" />
                  </View>
                )}
              </View>
              <Text style={[styles.characterCardName, { color: rarityColor }]}>{character.name}</Text>
              <Text style={styles.characterCardRarity}>{character.rarity.toUpperCase()}</Text>
              <View style={styles.characterCostContainer}>
                {isUnlocked ? (
                  <Text style={styles.unlockedText}>UNLOCKED</Text>
                ) : isFree ? (
                  <Text style={styles.freeText}>FREE</Text>
                ) : (
                  <>
                    <Gem size={16} color="#FFD700"fill="#FFD700" />
                    <Text style={styles.characterCost}>{cost}</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );

  const renderLives = () => (
    <ScrollView style={styles.contentScroll} contentContainerStyle={styles.livesContent}>
      <View style={styles.livesCard}>
        <Text style={styles.livesTitle}>Current Lives</Text>
        <Text style={styles.livesCount}>{progress.maxLives}</Text>
        <Text style={styles.livesDescription}>
          Purchase additional max lives to survive longer runs!
        </Text>
        <TouchableOpacity
          style={styles.lifesPurchaseButton}
          onPress={handleLifePurchase}
        >
          <Gem size={20} color="#FFFFFF" fill="#FFFFFF" />
          <Text style={styles.lifesPurchaseText}>Buy +1 Max Life (200 Gems)</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SHOP</Text>
        <View style={styles.gemDisplay}>
          <Gem size={20} color="#FFD700" fill="#FFD700" />
          <Text style={styles.gemCount}>{progress.gems}</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'upgrades' && styles.activeTab]}
          onPress={() => setSelectedTab('upgrades')}
        >
          <TrendingUp size={20} color={selectedTab === 'upgrades' ? '#FFD700' : '#AAA'} />
          <Text style={[styles.tabText, selectedTab === 'upgrades' && styles.activeTabText]}>
            Upgrades
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'artifacts' && styles.activeTab]}
          onPress={() => setSelectedTab('artifacts')}
        >
          <Sparkles size={20} color={selectedTab === 'artifacts' ? '#FFD700' : '#AAA'} />
          <Text style={[styles.tabText, selectedTab === 'artifacts' && styles.activeTabText]}>
            Artifacts
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'characters' && styles.activeTab]}
          onPress={() => setSelectedTab('characters')}
        >
          <Users size={20} color={selectedTab === 'characters' ? '#FFD700' : '#AAA'} />
          <Text style={[styles.tabText, selectedTab === 'characters' && styles.activeTabText]}>
            Characters
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {selectedTab === 'upgrades' && renderUpgrades()}
        {selectedTab === 'artifacts' && renderArtifacts()}
        {selectedTab === 'characters' && renderCharacters()}
        {selectedTab === 'lives' && renderLives()}
      </View>
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
    fontSize: 24,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  gemDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1a1030',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  gemCount: {
    fontSize: 16,
    fontWeight: '900' as const,
    color: '#FFD700',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: '#1a1030',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: '#2a2050',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#AAA',
  },
  activeTabText: {
    color: '#FFD700',
  },
  content: {
    flex: 1,
  },
  contentScroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  itemsGrid: {
    gap: 12,
    paddingBottom: 20,
  },
  upgradeCard: {
    backgroundColor: '#1a1030',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#2a2050',
  },
  maxedCard: {
    opacity: 0.6,
    borderColor: '#666',
  },
  upgradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  upgradeName: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: '#FFFFFF',
  },
  upgradeLevel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFD700',
  },
  upgradeDescription: {
    fontSize: 14,
    color: '#AAA',
    marginBottom: 6,
  },
  upgradeEffect: {
    fontSize: 12,
    color: '#00FF00',
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  upgradeCostContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  upgradeCost: {
    fontSize: 16,
    fontWeight: '900' as const,
    color: '#FFD700',
  },
  maxedText: {
    color: '#666',
  },
  artifactCard: {
    backgroundColor: '#1a1030',
    borderRadius: 16,
    padding: 16,
    borderWidth: 3,
  },
  ownedCard: {
    opacity: 0.6,
  },
  artifactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  artifactName: {
    fontSize: 18,
    fontWeight: '900' as const,
    flex: 1,
  },
  ownedBadge: {
    fontSize: 12,
    fontWeight: '900' as const,
    color: '#00FF00',
    backgroundColor: '#003300',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  artifactRarity: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#9370DB',
    marginBottom: 8,
  },
  artifactDescription: {
    fontSize: 14,
    color: '#AAA',
    marginBottom: 6,
  },
  artifactEffect: {
    fontSize: 13,
    color: '#00BFFF',
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  artifactCostContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  artifactCost: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: '#FFD700',
  },
  ownedText: {
    color: '#00FF00',
  },
  charactersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 20,
  },
  characterCard: {
    width: '48%',
    backgroundColor: '#1a1030',
    borderRadius: 16,
    padding: 12,
    borderWidth: 3,
    alignItems: 'center',
  },
  unlockedCard: {
    opacity: 0.6,
  },
  characterPortrait: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  characterInitial: {
    fontSize: 48,
    fontWeight: '900' as const,
    color: '#FFFFFF',
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  characterCardName: {
    fontSize: 14,
    fontWeight: '900' as const,
    textAlign: 'center',
    marginBottom: 4,
  },
  characterCardRarity: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#AAA',
    marginBottom: 8,
  },
  characterCostContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  characterCost: {
    fontSize: 16,
    fontWeight: '900' as const,
    color: '#FFD700',
  },
  unlockedText: {
    fontSize: 12,
    fontWeight: '900' as const,
    color: '#00FF00',
  },
  freeText: {
    fontSize: 12,
    fontWeight: '900' as const,
    color: '#4169E1',
  },
  livesContent: {
    padding: 20,
    alignItems: 'center',
  },
  livesCard: {
    backgroundColor: '#1a1030',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FF1493',
    width: '100%',
  },
  livesTitle: {
    fontSize: 20,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  livesCount: {
    fontSize: 64,
    fontWeight: '900' as const,
    color: '#FF1493',
    marginBottom: 16,
  },
  livesDescription: {
    fontSize: 14,
    color: '#AAA',
    textAlign: 'center',
    marginBottom: 24,
  },
  lifesPurchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FF1493',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  lifesPurchaseText: {
    fontSize: 16,
    fontWeight: '900' as const,
    color: '#FFFFFF',
  },
});
