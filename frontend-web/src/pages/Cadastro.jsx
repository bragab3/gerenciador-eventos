import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthApi, mensagemDeErro } from '../api.js';

export default function Cadastro() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nome: '', email: '', senha: '', confirmarSenha: '' });
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const atualizar = (campo) => (e) => {
    const valor = e.target.value;
    setForm((atual) => ({ ...atual, [campo]: valor }));
  };

  async function cadastrar(evento) {
    evento.preventDefault();
    setErro('');

    // Validação no front: as senhas precisam coincidir antes de chamar a API
    if (form.senha !== form.confirmarSenha) {
      setErro('As senhas não coincidem. Digite a mesma senha nos dois campos.');
      return;
    }

    setCarregando(true);
    try {
      await AuthApi.cadastrar({
        nome: form.nome.trim(),
        email: form.email.trim(),
        senha: form.senha,
      });
      window.alert('Administrador cadastrado com sucesso! Entre com o seu email e senha.');
      navigate('/');
    } catch (err) {
      setErro(mensagemDeErro(err));
      setCarregando(false);
    }
  }

  return (
    <main className="auth">
      <section className="auth-card">
        <h1>Cadastro de Administrador</h1>
        <p className="subtitulo">Crie o seu acesso para gerenciar eventos.</p>

        <form className="formulario" onSubmit={cadastrar}>
          <div className="campo">
            <label htmlFor="nome">Nome do Administrador</label>
            <input
              id="nome"
              type="text"
              value={form.nome}
              onChange={atualizar('nome')}
              maxLength={120}
              autoComplete="name"
              required
            />
          </div>

          <div className="campo">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={atualizar('email')}
              autoComplete="username"
              required
            />
          </div>

          <div className="campo">
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              type="password"
              value={form.senha}
              onChange={atualizar('senha')}
              minLength={6}
              maxLength={72}
              autoComplete="new-password"
              required
            />
          </div>

          <div className="campo">
            <label htmlFor="confirmarSenha">Confirmar Senha</label>
            <input
              id="confirmarSenha"
              type="password"
              value={form.confirmarSenha}
              onChange={atualizar('confirmarSenha')}
              autoComplete="new-password"
              required
            />
          </div>

          {erro && (
            <p className="erro" role="alert">
              {erro}
            </p>
          )}

          <button type="submit" className="btn btn-primario" disabled={carregando}>
            {carregando ? 'Cadastrando...' : 'Cadastrar'}
          </button>
          <button type="button" className="btn btn-secundario" onClick={() => navigate('/')}>
            Voltar ao login
          </button>
        </form>
      </section>
    </main>
  );
}
