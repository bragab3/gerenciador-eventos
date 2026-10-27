// Armazenamento seguro em memória (o módulo nativo não existe no Jest)
jest.mock('expo-secure-store', () => {
  const store = new Map();
  return {
    __store: store,
    getItemAsync: jest.fn(async (chave) => (store.has(chave) ? store.get(chave) : null)),
    setItemAsync: jest.fn(async (chave, valor) => {
      store.set(chave, valor);
    }),
    deleteItemAsync: jest.fn(async (chave) => {
      store.delete(chave);
    }),
  };
});

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
}));

// O SafeAreaProvider real só renderiza os filhos depois de receber as margens do sistema nativo
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
