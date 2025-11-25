import { router } from 'expo-router';
import { ChevronLeft, Lock, Check, Gem } from 'lucide-react-native';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGameState } from '@/contexts/GameStateContext';

export default function StageSelectScreen() {
  const insets = useSafeAreaInsets();
  const { progress, loadSavePoint, setCurrentStageRound } = useGameState();

  const handleStageSelect = (stage: number) => {
    if (stage <= progress.highestStage) {
      const savePoint = progress.savePoints[stage];
      if (savePoint) {
        loadSavePoint(stage);
      } else {
        setCurrentStageRound(stage, 1);
      }
      router.push('/character-select' as any);
    }
  };

  const stages = Array.from({ length: Math.max(progress.highestStage, 1) + 1 }, (_, i) => i + 1);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>STAGE SELECT</Text>
        <View style={styles.gemDisplay}>
          <Gem size={20} color="#FFD700" fill="#FFD700" />
          <Text style={styles.gemCount}>{progress.gems}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.stagesGrid}>
          {stages.map((stage) => {
            const isUnlocked = stage <= progress.highestStage;
            const hasSavePoint = !!progress.savePoints[stage];
            const isCurrent = stage === progress.currentStage;
            return (
              <TouchableOpacity
                key={stage}
                style={[
                  styles.stageCard,
                  !isUnlocked && styles.lockedStageCard,
                  isCurrent && styles.currentStageCard,
                ]}
                onPress={() => isUnlocked && handleStageSelect(stage)}
                disabled={!isUnlocked}
              >
                {!isUnlocked ? (
                  <Lock size={32} color="#666" />
                ) : (
                  <Text style={styles.stageNumber}>{stage}</Text>
                )}
                <Text style={[styles.stageLabel, !isUnlocked && styles.lockedText]}>
                  Stage {stage}
                </Text>
                {hasSavePoint && isUnlocked && (
                  <View style={styles.savePointBadge}>
                    <Check size={12} color="#FFFFFF" />
                    <Text style={styles.savePointText}>SAVE</Text>
                  </View>
                )}
                {isCurrent && (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentText}>CURRENT</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingVertical: 20,
  },
  stageCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#1a1030',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#2a2050',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  lockedStageCard: {
    backgroundColor: '#0f0a20',
    borderColor: '#666',
    opacity: 0.5,
  },
  currentStageCard: {
    borderColor: '#FFD700',
    backgroundColor: '#2a2050',
  },
  stageNumber: {
    fontSize: 48,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  stageLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#AAA',
  },
  lockedText: {
    color: '#666',
  },
  savePointBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#00FF00',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  savePointText: {
    fontSize: 8,
    fontWeight: '900' as const,
    color: '#000000',
  },
  currentBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 6,
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
  },
  currentText: {
    fontSize: 10,
    fontWeight: '900' as const,
    color: '#000000',
    textAlign: 'center',
  },
});
