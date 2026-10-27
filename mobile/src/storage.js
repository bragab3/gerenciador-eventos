import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Token JWT e senha salva são credenciais: no celular ficam no cofre do sistema
// (Keychain no iOS / Keystore no Android) via expo-secure-store.
// Na web (apenas para pré-visualização) o SecureStore não existe, então usamos AsyncStorage (localStorage).
const usaCofre = Platform.OS !== 'web';

const cofre = {
  ler: (chave) => (usaCofre ? SecureStore.getItemAsync(chave) : AsyncStorage.getItem(chave)),
  gravar: (chave, valor) =>
    usaCofre ? SecureStore.setItemAsync(chave, valor) : AsyncStorage.setItem(chave, valor),
  remover: (chave) => (usaCofre ? SecureStore.deleteItemAsync(chave) : AsyncStorage.removeItem(chave)),
};

const SESSAO_KEY = 'gerenciador.sessao';
const CREDENCIAIS_KEY = 'gerenciador.credenciais';

async function lerJson(chave) {
  try {
    const valor = await cofre.ler(chave);
    return valor ? JSON.parse(valor) : null;
  } catch {
    return null;
  }
}

// sessão: token JWT + dados do administrador logado
export const carregarSessao = () => lerJson(SESSAO_KEY);
export const salvarSessao = (sessao) => cofre.gravar(SESSAO_KEY, JSON.stringify(sessao));
export const limparSessao = () => cofre.remover(SESSAO_KEY);

// credenciais: email e senha, salvos somente quando "Gravar Senha" está marcado
export const carregarCredenciais = () => lerJson(CREDENCIAIS_KEY);
export const salvarCredenciais = (credenciais) => cofre.gravar(CREDENCIAIS_KEY, JSON.stringify(credenciais));
export const limparCredenciais = () => cofre.remover(CREDENCIAIS_KEY);
