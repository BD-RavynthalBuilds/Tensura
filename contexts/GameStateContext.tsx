import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useMemo } from 'react';

import { CharacterId, PlayerProgress, SavePoint } from '@/types/game';

const STORAGE_KEY = '@tensura_game_state';

const DEFAULT_PROGRESS: PlayerProgress = {
  gems: 500,
  lives: 5,
  maxLives: 5,
  unlockedCharacters: ['rimuru'],
  purchasedUpgrades: {},
  ownedArtifacts: [],
  highestStage: 1,
  currentStage: 1,
  currentRound: 1,
  savePoints: {},
};

export const [GameStateProvider, useGameState] = createContextHook(() => {
  const [progress, setProgress] = useState<PlayerProgress>(DEFAULT_PROGRESS);

  const loadProgressQuery = useQuery({
    queryKey: ['gameProgress'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_PROGRESS;
    },
  });

  const saveProgressMutation = useMutation({
    mutationFn: async (data: PlayerProgress) => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return data;
    },
  });

  const { mutate: mutateSaveProgress } = saveProgressMutation;

  useEffect(() => {
    if (loadProgressQuery.data) {
      setProgress(loadProgressQuery.data);
    }
  }, [loadProgressQuery.data]);

  const saveProgress = useCallback((updates: Partial<PlayerProgress>) => {
    const newProgress = { ...progress, ...updates };
    setProgress(newProgress);
    mutateSaveProgress(newProgress);
  }, [progress, mutateSaveProgress]);

  const spendGems = useCallback((amount: number): boolean => {
    if (progress.gems >= amount) {
      saveProgress({ gems: progress.gems - amount });
      return true;
    }
    return false;
  }, [progress.gems, saveProgress]);

  const earnGems = useCallback((amount: number) => {
    saveProgress({ gems: progress.gems + amount });
  }, [progress.gems, saveProgress]);

  const unlockCharacter = useCallback((characterId: CharacterId) => {
    if (!progress.unlockedCharacters.includes(characterId)) {
      saveProgress({
        unlockedCharacters: [...progress.unlockedCharacters, characterId],
      });
    }
  }, [progress.unlockedCharacters, saveProgress]);

  const purchaseUpgrade = useCallback((upgradeId: string) => {
    const currentLevel = progress.purchasedUpgrades[upgradeId] || 0;
    saveProgress({
      purchasedUpgrades: {
        ...progress.purchasedUpgrades,
        [upgradeId]: currentLevel + 1,
      },
    });
  }, [progress.purchasedUpgrades, saveProgress]);

  const purchaseArtifact = useCallback((artifactId: string) => {
    if (!progress.ownedArtifacts.includes(artifactId)) {
      saveProgress({
        ownedArtifacts: [...progress.ownedArtifacts, artifactId],
      });
    }
  }, [progress.ownedArtifacts, saveProgress]);

  const buyLife = useCallback(() => {
    if (progress.lives < progress.maxLives) {
      saveProgress({ lives: progress.lives + 1 });
    }
  }, [progress.lives, progress.maxLives, saveProgress]);

  const increaseMaxLives = useCallback(() => {
    saveProgress({
      maxLives: progress.maxLives + 1,
      lives: progress.lives + 1,
    });
  }, [progress.maxLives, progress.lives, saveProgress]);

  const loseLife = useCallback(() => {
    saveProgress({ lives: Math.max(0, progress.lives - 1) });
  }, [progress.lives, saveProgress]);

  const createSavePoint = useCallback((stage: number, round: number) => {
    const savePoint: SavePoint = {
      stage,
      round,
      timestamp: Date.now(),
      gems: progress.gems,
      lives: progress.lives,
    };
    saveProgress({
      savePoints: {
        ...progress.savePoints,
        [stage]: savePoint,
      },
      highestStage: Math.max(progress.highestStage, stage),
    });
  }, [progress.gems, progress.lives, progress.savePoints, progress.highestStage, saveProgress]);

  const loadSavePoint = useCallback((stage: number) => {
    const savePoint = progress.savePoints[stage];
    if (savePoint) {
      saveProgress({
        currentStage: savePoint.stage,
        currentRound: savePoint.round,
        gems: savePoint.gems,
        lives: savePoint.lives,
      });
    }
  }, [progress.savePoints, saveProgress]);

  const setCurrentStageRound = useCallback((stage: number, round: number) => {
    saveProgress({ currentStage: stage, currentRound: round });
  }, [saveProgress]);

  const resetProgress = useCallback(() => {
    setProgress(DEFAULT_PROGRESS);
    mutateSaveProgress(DEFAULT_PROGRESS);
  }, [mutateSaveProgress]);

  const getUpgradeLevel = useCallback((upgradeId: string): number => {
    return progress.purchasedUpgrades[upgradeId] || 0;
  }, [progress.purchasedUpgrades]);

  const hasArtifact = useCallback((artifactId: string): boolean => {
    return progress.ownedArtifacts.includes(artifactId);
  }, [progress.ownedArtifacts]);

  const isCharacterUnlocked = useCallback((characterId: CharacterId): boolean => {
    return progress.unlockedCharacters.includes(characterId);
  }, [progress.unlockedCharacters]);

  return useMemo(() => ({
    progress,
    isLoading: loadProgressQuery.isLoading,
    spendGems,
    earnGems,
    unlockCharacter,
    purchaseUpgrade,
    purchaseArtifact,
    buyLife,
    increaseMaxLives,
    loseLife,
    createSavePoint,
    loadSavePoint,
    setCurrentStageRound,
    resetProgress,
    getUpgradeLevel,
    hasArtifact,
    isCharacterUnlocked,
  }), [progress, loadProgressQuery.isLoading, spendGems, earnGems, unlockCharacter, purchaseUpgrade, purchaseArtifact, buyLife, increaseMaxLives, loseLife, createSavePoint, loadSavePoint, setCurrentStageRound, resetProgress, getUpgradeLevel, hasArtifact, isCharacterUnlocked]);
});
