import { Platform } from 'react-native';

// No emulador Android, "localhost" é o próprio emulador; 10.0.2.2 aponta para a máquina host.
const urlPadrao = Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';

// EXPO_PUBLIC_* é embutida no bundle pelo Expo (veja .env.example).
export const API_URL = process.env.EXPO_PUBLIC_API_URL || urlPadrao;
