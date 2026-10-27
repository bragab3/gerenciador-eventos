import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthApi, mensagemDeErro } from '../api.js';
import { getCredenciais, limparCredenciais, salvarCredenciais, salvarSessao } from '../auth.js';

export default function Login() {
  const navigate = useNavigate();
  const [salvas] = useState(getCredenciais);
  const [email, setEmail] = useState(salvas?.email ?? '');
  const [senha, setSenha] = useState(salvas?.senha ?? '');
  const [gravarSenha, setGravarSenha] = useState(Boolean(salvas));
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function entrar(evento) {
    evento.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      const dados = await AuthApi.login(email.trim(), senha);
      salvarSessao({
        token: dados.token,
        adminId: dados.adminId,
        nome: dados.nome,
        email: dados.email,
      });
      if (gravarSenha) {
        salvarCredenciais({ email: email.trim(), senha });
      } else {
        limparCredenciais();
      }
      navigate('/home');
    } catch (err) {
      setErro(mensagemDeErro(err));
      setCarregando(false);
    }
  }

  return (
    <main className="auth">
      <section className="auth-card">
        <h1>Gerenciador de Eventos</h1>
        <p className="subtitulo">Entre para cadastrar e acompanhar os seus eventos.</p>

        <form className="formulario" onSubmit={entrar}>
          <div className="campo">
            <label htmlFor="email">Email do Administrador</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="campo">
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <label className="opcao">
            <input
              type="checkbox"
              checked={gravarSenha}
              onChange={(e) => setGravarSenha(e.target.checked)}
            />
            Gravar Senha
          </label>

          {erro && (
            <p className="erro" role="alert">
              {erro}
            </p>
          )}

          <button type="submit" className="btn btn-primario" disabled={carregando}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
          <button type="button" className="btn btn-secundario" onClick={() => navigate('/cadastro')}>
            Cadastrar-se
          </button>
        </form>
      </section>
    </main>
  );
}
