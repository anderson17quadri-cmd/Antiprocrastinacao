import { useCallback, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

/**
 * Login com Google que entrega um id_token para o Firebase Auth.
 *
 * - Android/iOS (APK standalone): Google Sign-In NATIVO
 *   (@react-native-google-signin) — a folha de escolha de conta do sistema,
 *   sem navegador. O fluxo por navegador (expo-auth-session) NÃO funciona
 *   em APK: o Google bloqueia redirect de scheme customizado nos clients
 *   Android novos (erro 400 invalid_request).
 * - Web: expo-auth-session com o client Web (id_token direto).
 *
 * Exige EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (audiência do id_token nas duas
 * plataformas). No Android, o client OAuth do tipo Android (pacote + SHA-1
 * do keystore EAS, registrado no Firebase) é usado implicitamente pelo
 * Play Services — se o keystore mudar, o SHA-1 novo precisa ser cadastrado.
 */
export function useGoogleAuth(onIdToken: (idToken: string) => void) {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const isNative = Platform.OS === 'android' || Platform.OS === 'ios';

  // Fluxo web (só usado quando Platform.OS === 'web').
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: webClientId ?? '',
  });

  useEffect(() => {
    const idToken = response?.type === 'success' ? response.params.id_token : undefined;
    if (idToken) onIdToken(idToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  const nativeSignIn = useCallback(async () => {
    try {
      // Import dinâmico: o módulo nativo não existe no Expo Go/web.
      const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
      GoogleSignin.configure({ webClientId });
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const result = await GoogleSignin.signIn();
      if (result.type === 'success') {
        if (result.data.idToken) {
          onIdToken(result.data.idToken);
        } else {
          Alert.alert('Não foi possível entrar', 'O Google não devolveu as credenciais. Tente de novo.');
        }
      }
      // type === 'cancelled': usuário desistiu — silêncio.
    } catch (error) {
      Alert.alert(
        'Não foi possível entrar com o Google',
        error instanceof Error ? error.message : 'Tente novamente.',
      );
    }
  }, [webClientId, onIdToken]);

  return {
    available: Boolean(webClientId) && (isNative || Boolean(request)),
    promptAsync: isNative ? nativeSignIn : promptAsync,
  };
}
