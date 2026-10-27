import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthApi, mensagemDeErro } from '../api';
import Botao from '../components/Botao';
import Campo from '../components/Campo';
import Mensagem from '../components/Mensagem';
import { cores, raio } from '../theme';

export const MENSAGEM_CADASTRO_OK = 'Administrador cadastrado com sucesso! Entre com o seu email e senha.';

export default function CadastroScreen({ navigation }) {
  const [form, setForm] = useState({ nome: '', email: '', senha: '', confirmarSenha: '' });
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const atualizar = (campo) => (valor) => setForm((atual) => ({ ...atual, [campo]: valor }));

  async function cadastrar() {
    setErro('');

    if (!form.nome.trim() || !form.email.trim() || !form.senha) {
      setErro('Preencha nome, email e senha.');
      return;
    }
    if (form.senha.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    // Validação no app: as senhas precisam coincidir antes de chamar a API
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
      // Volta ao login exibindo a mensagem de sucesso, com o email já preenchido
      navigation.navigate('Login', { aviso: MENSAGEM_CADASTRO_OK, email: form.email.trim() });
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
            <Text style={s.titulo} accessibilityRole="header">Cadastro de Administrador</Text>
            <Text style={s.subtitulo}>Crie o seu acesso para gerenciar eventos.</Text>

            <Campo
              rotulo="Nome do Administrador"
              value={form.nome}
              onChangeText={atualizar('nome')}
              maxLength={120}
              autoComplete="name"
            />
            <Campo
              rotulo="Email"
              value={form.email}
              onChangeText={atualizar('email')}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
            />
            <Campo
              rotulo="Senha"
              value={form.senha}
              onChangeText={atualizar('senha')}
              secureTextEntry
              autoCapitalize="none"
              maxLength={72}
            />
            <Campo
              rotulo="Confirmar Senha"
              value={form.confirmarSenha}
              onChangeText={atualizar('confirmarSenha')}
              secureTextEntry
              autoCapitalize="none"
              maxLength={72}
              onSubmitEditing={cadastrar}
            />

            <Mensagem>{erro}</Mensagem>

            <Botao titulo="Cadastrar" carregando={carregando} onPress={cadastrar} />
            <Botao titulo="Voltar ao login" variante="secundario" onPress={() => navigation.goBack()} />
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
  titulo: { fontSize: 24, fontWeight: '800', color: cores.tinta },
  subtitulo: { fontSize: 15, color: cores.tintaSuave, marginBottom: 4 },
});
