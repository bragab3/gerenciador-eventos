// Armazenamento local (localStorage).
// - sessão: token JWT + dados do administrador logado (mantém o login após recarregar a página)
// - credenciais: email e senha, salvos somente quando "Gravar Senha" está marcado

const SESSAO_KEY = 'gerenciador:sessao';
const CREDENCIAIS_KEY = 'gerenciador:credenciais';

function ler(chave) {
  try {
    const valor = localStorage.getItem(chave);
    return valor ? JSON.parse(valor) : null;
  } catch {
    return null;
  }
}

export const getSessao = () => ler(SESSAO_KEY);
export const salvarSessao = (sessao) => localStorage.setItem(SESSAO_KEY, JSON.stringify(sessao));
export const limparSessao = () => localStorage.removeItem(SESSAO_KEY);

export const getCredenciais = () => ler(CREDENCIAIS_KEY);
export const salvarCredenciais = (credenciais) =>
  localStorage.setItem(CREDENCIAIS_KEY, JSON.stringify(credenciais));
export const limparCredenciais = () => localStorage.removeItem(CREDENCIAIS_KEY);
