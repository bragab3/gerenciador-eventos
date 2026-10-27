import * as SecureStore from 'expo-secure-store';
import { render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SessaoProvider } from '../src/SessaoContext';

export const SESSAO_KEY = 'gerenciador.sessao';
export const CREDENCIAIS_KEY = 'gerenciador.credenciais';

export const sessaoExemplo = { token: 'jwt-teste', adminId: 1, nome: 'Maria Silva', email: 'maria@email.com' };

const metricas = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

// Estado do "cofre" (SecureStore falso) antes de renderizar
export function prepararCofre({ sessao, credenciais } = {}) {
  SecureStore.__store.clear();
  if (sessao) SecureStore.__store.set(SESSAO_KEY, JSON.stringify(sessao));
  if (credenciais) SecureStore.__store.set(CREDENCIAIS_KEY, JSON.stringify(credenciais));
}

export const lerCofre = (chave) => {
  const valor = SecureStore.__store.get(chave);
  return valor ? JSON.parse(valor) : null;
};

// Renderiza com SafeAreaProvider + SessaoProvider reais
export function renderComSessao(ui) {
  return render(
    <SafeAreaProvider initialMetrics={metricas}>
      <SessaoProvider>{ui}</SessaoProvider>
    </SafeAreaProvider>
  );
}
