import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { definirAoNaoAutorizado, definirToken } from './api';
import { carregarSessao, limparSessao, salvarSessao } from './storage';

const SessaoContext = createContext(null);

export function SessaoProvider({ children }) {
  const [sessao, setSessao] = useState(null);
  const [pronto, setPronto] = useState(false);

  const sair = useCallback(async () => {
    definirToken(null);
    setSessao(null);
    await limparSessao();
  }, []);

  const entrar = useCallback(async (dados) => {
    definirToken(dados.token);
    setSessao(dados);
    await salvarSessao(dados);
  }, []);

  // Restaura o login ao abrir o app
  useEffect(() => {
    let ativo = true;
    carregarSessao().then((salva) => {
      if (!ativo) return;
      if (salva?.token) {
        definirToken(salva.token);
        setSessao(salva);
      }
      setPronto(true);
    });
    return () => {
      ativo = false;
    };
  }, []);

  // Token expirado/inválido em rota protegida: encerra a sessão e o app volta ao login
  useEffect(() => {
    definirAoNaoAutorizado(sair);
    return () => definirAoNaoAutorizado(null);
  }, [sair]);

  const valor = useMemo(() => ({ sessao, pronto, entrar, sair }), [sessao, pronto, entrar, sair]);
  return <SessaoContext.Provider value={valor}>{children}</SessaoContext.Provider>;
}

export function useSessao() {
  const contexto = useContext(SessaoContext);
  if (!contexto) throw new Error('useSessao deve ser usado dentro de <SessaoProvider>');
  return contexto;
}
