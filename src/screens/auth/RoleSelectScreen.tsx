import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  StatusBar,
} from 'react-native';
import { fonts } from '../../tokens';
import { useRoleStore } from '../../stores/roleStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Role config ──────────────────────────────────────────────
const ROLE_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  aluno:      { color: '#F26522', icon: '🏋️', label: 'Aluno' },
  personal:   { color: '#8B5CF6', icon: '🎯', label: 'Personal' },
  supervisor: { color: '#3B82F6', icon: '👁️', label: 'Supervisor' },
  financeiro: { color: '#10B981', icon: '💰', label: 'Financeiro' },
  recepcao:   { color: '#EC4899', icon: '🖥️', label: 'Recepção' },
  admin:      { color: '#EAB308', icon: '⚙️', label: 'Admin' },
};

interface Props {
  navigation: any;
}

export default function RoleSelectScreen({ navigation }: Props) {
  const { userRoles } = useRoleStore();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const transitionOpacity = useRef(new Animated.Value(0)).current;
  const transitionScale = useRef(new Animated.Value(0.8)).current;

  const handleSelect = async (role: string) => {
    setSelectedRole(role);

    // Animate transition
    Animated.parallel([
      Animated.timing(transitionOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(transitionScale, {
        toValue: 1,
        speed: 14,
        bounciness: 4,
        useNativeDriver: true,
      }),
    ]).start();

    // Wait, then navigate
    setTimeout(() => {
      useRoleStore.getState().setCurrentRole(role);
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    }, 800);
  };

  const rolesToShow = userRoles
    .filter((r) => ROLE_CONFIG[r])
    .map((r) => ({ key: r, ...ROLE_CONFIG[r] }));

  const selectedConfig = selectedRole ? ROLE_CONFIG[selectedRole] : null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      {/* Selection view */}
      {!selectedRole && (
        <View style={styles.content}>
          <Text style={styles.title}>Quem está entrando?</Text>
          <View style={styles.rolesRow}>
            {rolesToShow.map((role) => (
              <RoleCircle
                key={role.key}
                icon={role.icon}
                label={role.label}
                color={role.color}
                onPress={() => handleSelect(role.key)}
              />
            ))}
          </View>
        </View>
      )}

      {/* Transition view */}
      {selectedRole && selectedConfig && (
        <Animated.View
          style={[
            styles.transitionView,
            { opacity: transitionOpacity, transform: [{ scale: transitionScale }] },
          ]}
        >
          <View style={[styles.transitionCircle, {
            backgroundColor: selectedConfig.color + '18',
            borderColor: selectedConfig.color + '60',
          }]}>
            <Text style={styles.transitionIcon}>{selectedConfig.icon}</Text>
          </View>
          <Text style={styles.transitionText}>
            Entrando como {selectedConfig.label}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

// ── Role Circle Component ────────────────────────────────────
function RoleCircle({
  icon,
  label,
  color,
  onPress,
}: {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.92,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      speed: 14,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.roleItem, { transform: [{ scale: scaleAnim }] }]}>
        <View style={[styles.roleCircle, {
          backgroundColor: color + '18',
          borderColor: color + '60',
        }]}>
          <Text style={styles.roleIcon}>{icon}</Text>
        </View>
        <Text style={styles.roleLabel}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

// ── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontFamily: 'Sora_800ExtraBold',
    fontSize: 22,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 48,
  },
  rolesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 32,
  },

  // Role circle
  roleItem: {
    alignItems: 'center',
    gap: 12,
  },
  roleCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIcon: {
    fontSize: 36,
  },
  roleLabel: {
    fontFamily: 'Sora_700Bold',
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
  },

  // Transition
  transitionView: {
    alignItems: 'center',
    gap: 20,
  },
  transitionCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transitionIcon: {
    fontSize: 42,
  },
  transitionText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 16,
    color: '#F26522',
  },
});
