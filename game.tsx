import { useLocalSearchParams, router } from 'expo-router';
import { X, Heart, Zap as ZapIcon, Target, Flame } from 'lucide-react-native';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CHARACTERS } from '@/constants/characters';
import { CharacterId, Enemy, Particle, Move } from '@/types/game';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ARENA_WIDTH = SCREEN_WIDTH;
const ARENA_HEIGHT = SCREEN_HEIGHT;
const PLAYER_SIZE = 50;
const ENEMY_SIZE = 40;
const JOYSTICK_SIZE = 100;
const JOYSTICK_KNOB_SIZE = 50;

export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const characterId = (params.character as CharacterId) || 'rimuru';
  const character = CHARACTERS[characterId];

  const [playerX, setPlayerX] = useState(ARENA_WIDTH / 2);
  const [playerY, setPlayerY] = useState(ARENA_HEIGHT / 2);
  const [playerHp, setPlayerHp] = useState(character.baseStats.hp);
  const [playerMaxHp] = useState(character.baseStats.hp);
  const [playerMp, setPlayerMp] = useState(character.baseStats.mp);
  const [playerMaxMp] = useState(character.baseStats.mp);
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [xpToNext, setXpToNext] = useState(100);
  const [kills, setKills] = useState(0);
  const [evolutionLevel, setEvolutionLevel] = useState(0);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});

  const velocityX = useRef(0);
  const velocityY = useRef(0);
  const gameLoopRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef(Date.now());

  const joystickX = useRef(new Animated.Value(0)).current;
  const joystickY = useRef(new Animated.Value(0)).current;

  const evolution = character.evolutions[evolutionLevel];
  const statsMultiplier = evolution.statsMultiplier;

  const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {},
      onPanResponderMove: (_, gesture) => {
        const distance = Math.sqrt(gesture.dx ** 2 + gesture.dy ** 2);
        const maxDistance = JOYSTICK_SIZE / 2 - JOYSTICK_KNOB_SIZE / 2;
        const clampedDistance = Math.min(distance, maxDistance);
        const angle = Math.atan2(gesture.dy, gesture.dx);

        const x = clampedDistance * Math.cos(angle);
        const y = clampedDistance * Math.sin(angle);

        joystickX.setValue(x);
        joystickY.setValue(y);

        velocityX.current = (x / maxDistance) * character.baseStats.speed * statsMultiplier;
        velocityY.current = (y / maxDistance) * character.baseStats.speed * statsMultiplier;
      },
      onPanResponderRelease: () => {
        Animated.spring(joystickX, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
        Animated.spring(joystickY, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
        velocityX.current = 0;
        velocityY.current = 0;
      },
    });

  const spawnEnemy = useCallback(() => {
    const side = Math.floor(Math.random() * 4);
    let x = 0;
    let y = 0;

    switch (side) {
      case 0:
        x = Math.random() * ARENA_WIDTH;
        y = -ENEMY_SIZE;
        break;
      case 1:
        x = ARENA_WIDTH + ENEMY_SIZE;
        y = Math.random() * ARENA_HEIGHT;
        break;
      case 2:
        x = Math.random() * ARENA_WIDTH;
        y = ARENA_HEIGHT + ENEMY_SIZE;
        break;
      case 3:
        x = -ENEMY_SIZE;
        y = Math.random() * ARENA_HEIGHT;
        break;
    }

    const enemyTypes = ['slime', 'wolf', 'orc', 'goblin'] as const;
    const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];

    const newEnemy: Enemy = {
      id: `enemy-${Date.now()}-${Math.random()}`,
      x,
      y,
      hp: 20 + level * 5,
      maxHp: 20 + level * 5,
      speed: 1.5 + level * 0.1,
      damage: 5 + level * 2,
      type,
      size: ENEMY_SIZE,
    };

    setEnemies((prev) => [...prev, newEnemy]);
  }, [level]);

  const createParticles = useCallback((x: number, y: number, color: string, count: number) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 2 + Math.random() * 3;
      newParticles.push({
        id: `particle-${Date.now()}-${Math.random()}-${i}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30,
        maxLife: 30,
        color,
        size: 4 + Math.random() * 4,
        type: 'hit',
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
  }, []);

  const attack = useCallback(
    (move: Move) => {
      if (cooldowns[move.id] || playerMp < move.mpCost) return;

      setPlayerMp((prev) => prev - move.mpCost);
      setCooldowns((prev) => ({ ...prev, [move.id]: move.cooldown }));

      const attackColor = character.element === 'fire' ? '#FF4500' : character.element === 'water' ? '#00BFFF' : '#FFD700';

      createParticles(playerX, playerY, attackColor, 8);

      setEnemies((prevEnemies) => {
        const updatedEnemies = prevEnemies.map((enemy) => {
          const dx = enemy.x - playerX;
          const dy = enemy.y - playerY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance <= move.range) {
            const newHp = enemy.hp - move.damage * statsMultiplier;
            createParticles(enemy.x, enemy.y, '#FF0000', 6);
            return { ...enemy, hp: newHp };
          }
          return enemy;
        });

        const aliveEnemies = updatedEnemies.filter((e) => e.hp > 0);
        const killedCount = updatedEnemies.length - aliveEnemies.length;

        if (killedCount > 0) {
          setKills((prev) => prev + killedCount);
          setXp((prev) => {
            const newXp = prev + killedCount * 50;
            if (newXp >= xpToNext) {
              setLevel((l) => l + 1);
              setXpToNext((x) => Math.floor(x * 1.5));
              setPlayerHp(playerMaxHp);
              setPlayerMp(playerMaxMp);
              return newXp - xpToNext;
            }
            return newXp;
          });
        }

        return aliveEnemies;
      });
    },
    [
      cooldowns,
      playerMp,
      playerX,
      playerY,
      character.element,
      statsMultiplier,
      createParticles,
      xpToNext,
      playerMaxHp,
      playerMaxMp,
    ]
  );

  useEffect(() => {
    const evolution = character.evolutions[evolutionLevel];
    if (level >= evolution.requirements.level && kills >= (evolution.requirements.kills || 0)) {
      if (evolutionLevel < character.evolutions.length - 1) {
        setEvolutionLevel((prev) => prev + 1);
        createParticles(playerX, playerY, '#FFD700', 20);
      }
    }
  }, [level, kills, evolutionLevel, character.evolutions, playerX, playerY, createParticles]);

  useEffect(() => {
    const spawnInterval = setInterval(() => {
      if (!isPaused && enemies.length < 15) {
        spawnEnemy();
      }
    }, 2000);

    return () => clearInterval(spawnInterval);
  }, [isPaused, enemies.length, spawnEnemy]);

  useEffect(() => {
    const cooldownInterval = setInterval(() => {
      setCooldowns((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((key) => {
          updated[key] = Math.max(0, updated[key] - 0.1);
          if (updated[key] === 0) {
            delete updated[key];
          }
        });
        return updated;
      });
    }, 100);

    return () => clearInterval(cooldownInterval);
  }, []);

  useEffect(() => {
    const mpRegenInterval = setInterval(() => {
      if (!isPaused) {
        setPlayerMp((prev) => Math.min(prev + 1, playerMaxMp));
      }
    }, 500);

    return () => clearInterval(mpRegenInterval);
  }, [isPaused, playerMaxMp]);

  useEffect(() => {
    const gameLoop = () => {
      if (isPaused) {
        gameLoopRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      const now = Date.now();
      lastTimeRef.current = now;

      setPlayerX((prev) => {
        const newX = prev + velocityX.current;
        return Math.max(PLAYER_SIZE / 2, Math.min(ARENA_WIDTH - PLAYER_SIZE / 2, newX));
      });

      setPlayerY((prev) => {
        const newY = prev + velocityY.current;
        return Math.max(PLAYER_SIZE / 2, Math.min(ARENA_HEIGHT - PLAYER_SIZE / 2, newY));
      });

      setEnemies((prevEnemies) =>
        prevEnemies.map((enemy) => {
          const dx = playerX - enemy.x;
          const dy = playerY - enemy.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < PLAYER_SIZE / 2 + enemy.size / 2) {
            setPlayerHp((hp) => Math.max(0, hp - 0.5));
          }

          if (distance > 0) {
            const moveX = (dx / distance) * enemy.speed;
            const moveY = (dy / distance) * enemy.speed;
            return {
              ...enemy,
              x: enemy.x + moveX,
              y: enemy.y + moveY,
            };
          }
          return enemy;
        })
      );

      setParticles((prevParticles) =>
        prevParticles
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            life: p.life - 1,
          }))
          .filter((p) => p.life > 0)
      );

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [isPaused, playerX, playerY]);

  useEffect(() => {
    if (playerHp <= 0) {
      setIsPaused(true);
    }
  }, [playerHp]);

  const handleExit = () => {
    router.back();
  };

  const basicMove = character.moves[0];
  const chargeMove = character.moves[1];
  const specialMove = character.moves[2];
  const ultimateMove = character.moves[3];

  return (
    <View style={styles.container}>
      <View style={styles.arena}>
        <View style={[styles.player, { left: playerX - PLAYER_SIZE / 2, top: playerY - PLAYER_SIZE / 2 }]}>
          <Text style={styles.playerText}>{character.name.charAt(0)}</Text>
        </View>

        {enemies.map((enemy) => (
          <View
            key={enemy.id}
            style={[
              styles.enemy,
              {
                left: enemy.x - enemy.size / 2,
                top: enemy.y - enemy.size / 2,
                width: enemy.size,
                height: enemy.size,
              },
            ]}
          >
            <View style={styles.enemyHealthBar}>
              <View style={[styles.enemyHealthFill, { width: `${(enemy.hp / enemy.maxHp) * 100}%` }]} />
            </View>
          </View>
        ))}

        {particles.map((particle) => (
          <View
            key={particle.id}
            style={[
              styles.particle,
              {
                left: particle.x,
                top: particle.y,
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                opacity: particle.life / particle.maxLife,
              },
            ]}
          />
        ))}
      </View>

      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={handleExit} style={styles.exitButton}>
          <X size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.statsPanel}>
          <View style={styles.statRow}>
            <Heart size={16} color="#FF4444" fill="#FF4444" />
            <View style={styles.statBarContainer}>
              <View style={[styles.statBarFill, { width: `${(playerHp / playerMaxHp) * 100}%`, backgroundColor: '#FF4444' }]} />
            </View>
            <Text style={styles.statText}>
              {Math.floor(playerHp)}/{playerMaxHp}
            </Text>
          </View>
          <View style={styles.statRow}>
            <ZapIcon size={16} color="#4444FF" fill="#4444FF" />
            <View style={styles.statBarContainer}>
              <View style={[styles.statBarFill, { width: `${(playerMp / playerMaxMp) * 100}%`, backgroundColor: '#4444FF' }]} />
            </View>
            <Text style={styles.statText}>
              {Math.floor(playerMp)}/{playerMaxMp}
            </Text>
          </View>
        </View>

        <View style={styles.levelPanel}>
          <Text style={styles.levelText}>LV {level}</Text>
          <View style={styles.xpBar}>
            <View style={[styles.xpFill, { width: `${(xp / xpToNext) * 100}%` }]} />
          </View>
        </View>

        <View style={styles.killsPanel}>
          <Target size={16} color="#FFD700" />
          <Text style={styles.killsText}>{kills}</Text>
        </View>
      </View>

      <View style={styles.evolutionBadge}>
        <Flame size={18} color="#FFD700" />
        <Text style={styles.evolutionText}>{evolution.name}</Text>
      </View>

      {playerHp <= 0 && (
        <View style={styles.gameOver}>
          <Text style={styles.gameOverTitle}>DEFEATED</Text>
          <Text style={styles.gameOverStats}>Level: {level}</Text>
          <Text style={styles.gameOverStats}>Kills: {kills}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleExit}>
            <Text style={styles.retryButtonText}>RETURN TO SELECT</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.controls, { bottom: insets.bottom + 20 }]}>
        <View style={styles.joystickContainer}>
          <View style={styles.joystickBase} {...panResponder.panHandlers}>
            <Animated.View
              style={[
                styles.joystickKnob,
                {
                  transform: [{ translateX: joystickX }, { translateY: joystickY }],
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.attackButtons}>
          <View style={styles.attackRow}>
            <AttackButton move={basicMove} cooldown={cooldowns[basicMove.id]} onPress={() => attack(basicMove)} />
            <AttackButton move={chargeMove} cooldown={cooldowns[chargeMove.id]} onPress={() => attack(chargeMove)} />
          </View>
          <View style={styles.attackRow}>
            <AttackButton move={specialMove} cooldown={cooldowns[specialMove.id]} onPress={() => attack(specialMove)} />
            <AttackButton move={ultimateMove} cooldown={cooldowns[ultimateMove.id]} onPress={() => attack(ultimateMove)} />
          </View>
        </View>
      </View>
    </View>
  );
}

function AttackButton({ move, cooldown, onPress }: { move: Move; cooldown: number; onPress: () => void }) {
  const isReady = !cooldown;
  const percentage = cooldown ? (cooldown / move.cooldown) * 100 : 0;

  return (
    <TouchableOpacity
      style={[styles.attackButton, !isReady && styles.attackButtonDisabled]}
      onPress={onPress}
      disabled={!isReady}
      activeOpacity={0.7}
    >
      <Text style={styles.attackButtonText}>{move.name.split(' ')[0]}</Text>
      {!isReady && (
        <View style={styles.cooldownOverlay}>
          <View style={[styles.cooldownFill, { height: `${percentage}%` }]} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0520',
  },
  arena: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#1a1030',
  },
  player: {
    position: 'absolute',
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    borderRadius: PLAYER_SIZE / 2,
    backgroundColor: '#00BFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  playerText: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: '#FFFFFF',
  },
  enemy: {
    position: 'absolute',
    borderRadius: 20,
    backgroundColor: '#FF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  enemyHealthBar: {
    position: 'absolute',
    top: -8,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#000000',
    borderRadius: 2,
  },
  enemyHealthFill: {
    height: '100%',
    backgroundColor: '#00FF00',
    borderRadius: 2,
  },
  particle: {
    position: 'absolute',
    borderRadius: 10,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 10,
  },
  exitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsPanel: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 10,
    padding: 8,
    gap: 4,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statBarContainer: {
    flex: 1,
    height: 12,
    backgroundColor: '#2a2050',
    borderRadius: 6,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  statText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    width: 50,
  },
  levelPanel: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 10,
    padding: 8,
    minWidth: 60,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '900' as const,
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 4,
  },
  xpBar: {
    height: 8,
    backgroundColor: '#2a2050',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#00FF00',
    borderRadius: 4,
  },
  killsPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 10,
    padding: 8,
  },
  killsText: {
    fontSize: 14,
    fontWeight: '900' as const,
    color: '#FFD700',
  },
  evolutionBadge: {
    position: 'absolute',
    top: 80,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  evolutionText: {
    fontSize: 12,
    fontWeight: '900' as const,
    color: '#FFD700',
  },
  gameOver: {
    position: 'absolute',
    top: '30%',
    left: '10%',
    right: '10%',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FF4444',
  },
  gameOverTitle: {
    fontSize: 36,
    fontWeight: '900' as const,
    color: '#FF4444',
    marginBottom: 20,
  },
  gameOverStats: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#4444FF',
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 20,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '900' as const,
    color: '#FFFFFF',
  },
  controls: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  joystickContainer: {
    width: JOYSTICK_SIZE,
    height: JOYSTICK_SIZE,
  },
  joystickBase: {
    width: JOYSTICK_SIZE,
    height: JOYSTICK_SIZE,
    borderRadius: JOYSTICK_SIZE / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  joystickKnob: {
    width: JOYSTICK_KNOB_SIZE,
    height: JOYSTICK_KNOB_SIZE,
    borderRadius: JOYSTICK_KNOB_SIZE / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  attackButtons: {
    gap: 10,
  },
  attackRow: {
    flexDirection: 'row',
    gap: 10,
  },
  attackButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FF1493',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFD700',
    position: 'relative',
    overflow: 'hidden',
  },
  attackButtonDisabled: {
    opacity: 0.5,
  },
  attackButtonText: {
    fontSize: 11,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  cooldownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  cooldownFill: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
});
