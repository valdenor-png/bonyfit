import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  WORKOUT_TEMPLATE: 'offline_workout_template',
  USER_PROFILE: 'offline_user_profile',
  LAST_SYNC: 'offline_last_sync',
};

export async function cacheWorkoutTemplate(template: any): Promise<void> {
  await AsyncStorage.setItem(KEYS.WORKOUT_TEMPLATE, JSON.stringify(template));
}

export async function getCachedWorkoutTemplate(): Promise<any | null> {
  const data = await AsyncStorage.getItem(KEYS.WORKOUT_TEMPLATE);
  return data ? JSON.parse(data) : null;
}

export async function cacheUserProfile(user: any): Promise<void> {
  await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(user));
}

export async function getCachedUserProfile(): Promise<any | null> {
  const data = await AsyncStorage.getItem(KEYS.USER_PROFILE);
  return data ? JSON.parse(data) : null;
}

export async function setLastSync(): Promise<void> {
  await AsyncStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());
}

export async function getLastSync(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.LAST_SYNC);
}

export async function isOffline(): Promise<boolean> {
  try {
    const response = await fetch('https://www.google.com', { method: 'HEAD' });
    return !response.ok;
  } catch {
    return true;
  }
}

export async function clearCache(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}
