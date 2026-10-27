import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthApi, mensagemDeErro } from '../api';
import Botao from '../components/Botao';
import Campo from '../components/Campo';
import Checkbox from '../components/Checkbox';
import Mensagem from '../components/Mensagem';
import { useSessao } from '../SessaoContext';
import { carregarCredenciais, limparCredenciais, salvarCredenciais } from '../storage';
import { cores, raio } from '../theme';

export default function LoginScreen({ navigation, route }) {
  const { entrar } = useSessao();
  const aviso = route?.params?.aviso;
  const emailDoCadastro = route?.params?.email;

  const [email, setEmail] = useState(emailDoCadastro ?? '');
  const [senha, setSenha] = useState('');
  const [gravarSenha, setGravarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  // "Gravar Senha": preenche email e senha salvos nas próximas vezes
  useEffect(() => {
    if (emailDoCadastro) {
      setEmail(emailDoCadastro);
      setSenha('');
      return undefined;
    }
    let ativo = true;
    carregarCredenciais().then((salvas) => {
      if (ativo && salvas) {
        setEmail(salvas.email ?? '');
        setSenha(salvas.senha ?? '');
        setGravarSenha(true);
      }
    });
    return () => {
      ativo = false;
    };
  }, [emailDoCadastro]);

  async function fazerLogin() {
    setErro('');
    if (!email.trim() || !senha) {
      setErro('Informe o email e a senha.');
      return;
    }

    setCarregando(true);
    try {
      const dados = await AuthApi.login(email.trim(), senha);

      if (gravarSenha) {
        await salvarCredenciais({ email: email.trim(), senha });
      } else {
        await limparCredenciais();
      }
      // Ao salvar a sessão, a navegação troca automaticamente para a Home
      await entrar({ token: dados.token, adminId: dados.adminId, nome: dados.nome, email: dados.email });
    } catch (err) {
      setErro(mensagemDeErro(err));
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={s.tela}>
      <KeyboardAvoidingView style={s.tela} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.centro} keyboardShouldPersistTaps="handled">
          <View style={s.card}>
            <Text style={s.titulo} accessibilityRole="header">Gerenciador de Eventos</Text>
            <Text style={s.subtitulo}>Entre para cadastrar e acompanhar os seus eventos.</Text>

            <Mensagem tipo="sucesso">{aviso}</Mensagem>

            <Campo
              rotulo="Email do Administrador"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="username"
              autoComplete="email"
            />
            <Campo
              rotulo="Senha"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
              autoCapitalize="none"
              textContentType="password"
              autoComplete="password"
              onSubmitEditing={fazerLogin}
            />

            <Checkbox rotulo="Gravar Senha" valor={gravarSenha} onChange={setGravarSenha} />

            <Mensagem>{erro}</Mensagem>

            <Botao titulo="Entrar" carregando={carregando} onPress={fazerLogin} />
            <Botao titulo="Cadastrar-se" variante="secundario" onPress={() => navigation.navigate('Cadastro')} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.papel },
  centro: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    backgroundColor: cores.superficie,
    borderRadius: raio + 4,
    borderWidth: 1,
    borderColor: cores.linha,
    padding: 24,
    gap: 14,
  },
  titulo: { fontSize: 26, fontWeight: '800', color: cores.tinta },
  subtitulo: { fontSize: 15, color: cores.tintaSuave, marginBottom: 4 },
});
