import AsyncStorage from "@react-native-async-storage/async-storage";

import { createEmptyPerformanceProfile, normalizePerformanceProfile } from "../data/performanceProfile";

const KEY = "athleteos.performanceProfile.v1";
export async function loadPerformanceProfile() { try { const value = await AsyncStorage.getItem(KEY); return value ? normalizePerformanceProfile(JSON.parse(value)) : createEmptyPerformanceProfile(); } catch { return createEmptyPerformanceProfile(); } }
export async function savePerformanceProfile(profile) { await AsyncStorage.setItem(KEY, JSON.stringify(normalizePerformanceProfile(profile))); }
