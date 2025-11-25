import { router } from 'expo-router';
import { ChevronLeft, RotateCcw, Info } from 'lucide-react-native';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGameState } from '@/contexts/GameStateContext';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { resetProgress, progress } = useGameState();

  const handleReset = () => {
    Alert.alert(
      'Reset Progress',
      'Are you sure you want to reset all progress? This cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetProgress();
            Alert.alert('Progress Reset', 'All progress has been reset.');
            router.replace('/');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SETTINGS</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game Info</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Total Gems</Text>
            <Text style={styles.infoValue}>{progress.gems}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Lives</Text>
            <Text style={styles.infoValue}>{progress.lives} / {progress.maxLives}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Unlocked Characters</Text>
            <Text style={styles.infoValue}>{progress.unlockedCharacters.length}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Highest Stage</Text>
            <Text style={styles.infoValue}>{progress.highestStage}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game Rules</Text>
          <View style={styles.rulesCard}>
            <View style={styles.ruleItem}>
              <Info size={16} color="#00BFFF" />
              <Text style={styles.ruleText}>Each stage has 10 rounds of 2 minutes each</Text>
            </View>
            <View style={styles.ruleItem}>
              <Info size={16} color="#00BFFF" />
              <Text style={styles.ruleText}>Earn gems by defeating enemies and completing rounds</Text>
            </View>
            <View style={styles.ruleItem}>
              <Info size={16} color="#00BFFF" />
              <Text style={styles.ruleText}>You have {progress.maxLives} lives - death resets to last save point</Text>
            </View>
            <View style={styles.ruleItem}>
              <Info size={16} color="#00BFFF" />
              <Text style={styles.ruleText}>Create save points every 10 rounds (1 stage)</Text>
            </View>
            <View style={styles.ruleItem}>
              <Info size={16} color="#00BFFF" />
              <Text style={styles.ruleText}>Purchase upgrades, artifacts, and characters in the shop</Text>
            </View>
          </View>
        </View>

        <View style={[styles.section, { paddingBottom: insets.bottom + 20 }]}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <RotateCcw size={20} color="#FFFFFF" />
            <Text style={styles.resetButtonText}>Reset All Progress</Text>
          </TouchableOpacity>
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
    fontSize: 24,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900' as const,
    color: '#FFD700',
    marginBottom: 16,
    letterSpacing: 1,
  },
  infoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1030',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#AAA',
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: '#FFFFFF',
  },
  rulesCard: {
    backgroundColor: '#1a1030',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  ruleItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  ruleText: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
    lineHeight: 20,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FF4444',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '900' as const,
    color: '#FFFFFF',
  },
});
