import { router } from 'expo-router';
import { Zap, Sparkles, ShoppingBag, Settings } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function TitleScreen() {
  const insets = useSafeAreaInsets();
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const shinePosition = useRef(new Animated.Value(-200)).current;
  const particleAnims = useRef(
    Array.from({ length: 20 }, () => {
      const initX = Math.random() * width;
      const initY = Math.random() * height;
      return {
        x: initX,
        y: new Animated.Value(initY),
        opacity: new Animated.Value(0),
      };
    })
  ).current;

  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shinePosition, {
          toValue: width + 200,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(shinePosition, {
          toValue: -200,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
      ])
    ).start();

    particleAnims.forEach((anim, i) => {
      const startY = height + 50;
      anim.y.setValue(startY);
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 200),
          Animated.parallel([
            Animated.timing(anim.opacity, {
              toValue: 0.8,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(anim.y, {
              toValue: -50,
              duration: 3000,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(anim.opacity, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(anim.y, {
            toValue: startY,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, [logoOpacity, logoScale, shinePosition, particleAnims]);

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePlay = () => {
    router.push('/stage-select' as any);
  };

  const handleShop = () => {
    router.push('/shop' as any);
  };

  const handleSettings = () => {
    router.push('/settings' as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.background}>
        <View style={styles.gradientTop} />
        <View style={styles.gradientBottom} />
      </View>

      {particleAnims.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.particle,
            {
              left: anim.x,
              opacity: anim.opacity,
              transform: [{ translateY: anim.y }],
            },
          ]}
        />
      ))}

      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <View style={styles.titleWrapper}>
          <View style={styles.iconRow}>
            <Zap size={36} color="#FFD700" fill="#FFD700" />
            <Sparkles size={32} color="#FF1493" />
          </View>
          <Text style={styles.title}>TENSURA</Text>
          <Text style={styles.subtitle}>FIGHTERS EX</Text>
          <Animated.View
            style={[
              styles.shine,
              {
                transform: [{ translateX: shinePosition }],
              },
            ]}
          />
        </View>
        <Text style={styles.tagline}>The Slime Awakens</Text>
      </Animated.View>

      <View style={[styles.buttonContainer, { bottom: 80 + insets.bottom }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePlay}
        >
          <Animated.View
            style={[
              styles.playButton,
              {
                transform: [{ scale: buttonScale }],
              },
            ]}
          >
            <Text style={styles.playButtonText}>START ADVENTURE</Text>
            <View style={styles.buttonGlow} />
          </Animated.View>
        </TouchableOpacity>

        <View style={styles.menuButtons}>
          <TouchableOpacity style={styles.menuButton} onPress={handleShop}>
            <ShoppingBag size={24} color="#FFD700" />
            <Text style={styles.menuButtonText}>Shop</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuButton} onPress={handleSettings}>
            <Settings size={24} color="#00BFFF" />
            <Text style={styles.menuButtonText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.version, { bottom: 40 + insets.bottom }]}>v1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0520',
    alignItems: 'center',
    justifyContent: 'center',
  },
  background: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: '#1a0f3f',
    opacity: 0.6,
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: '#0a0520',
    opacity: 0.8,
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#00BFFF',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 100,
  },
  titleWrapper: {
    position: 'relative',
    alignItems: 'center',
    overflow: 'hidden',
  },
  iconRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 64,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    textShadowColor: '#00BFFF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#FF1493',
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    letterSpacing: 8,
    marginTop: -8,
  },
  shine: {
    position: 'absolute',
    width: 100,
    height: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ skewX: '-20deg' }],
  },
  tagline: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#9370DB',
    marginTop: 16,
    letterSpacing: 2,
  },
  buttonContainer: {
    position: 'absolute',
  },
  playButton: {
    backgroundColor: '#FF1493',
    paddingHorizontal: 60,
    paddingVertical: 20,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#FFD700',
    position: 'relative',
    overflow: 'hidden',
  },
  playButtonText: {
    fontSize: 22,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  buttonGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    opacity: 0.1,
  },
  version: {
    position: 'absolute',
    fontSize: 12,
    color: '#666',
    fontWeight: '600' as const,
  },
  menuButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1a1030',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#2a2050',
  },
  menuButtonText: {
    fontSize: 16,
    fontWeight: '900' as const,
    color: '#FFFFFF',
  },
});
