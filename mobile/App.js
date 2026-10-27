import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SessaoProvider, useSessao } from './src/SessaoContext';
import CadastroScreen from './src/screens/CadastroScreen';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import { cores } from './src/theme';

const Stack = createNativeStackNavigator();

// Rotas protegidas por JWT: sem sessão só existem Login e Cadastro; com sessão, só a Home.
// Ao entrar/sair, a navegação troca sozinha porque o conjunto de telas muda.
export function Navegacao() {
  const { sessao, pronto } = useSessao();

  if (!pronto) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: cores.papel }}>
        <ActivityIndicator size="large" color={cores.cobalto} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {sessao?.token ? (
          <Stack.Screen name="Home" component={HomeScreen} />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Cadastro" component={CadastroScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SessaoProvider>
        <StatusBar style="auto" />
        <Navegacao />
      </SessaoProvider>
    </SafeAreaProvider>
  );
}
