import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

/**
 * Login com Google via OAuth (expo-auth-session) para gerar um id_token
 * que é trocado por uma sessão real do Firebase Auth.
 *
 * Exige EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: o "Client ID" tipo Web gerado
 * automaticamente pelo Firebase ao ativar o provedor Google em
 * Authentication > Sign-in method (Firebase valida o id_token contra
 * esse client id, por isso é o mesmo em todas as plataformas — não
 * precisa de um client id Android separado nem de SHA-1 cadastrado).
 * Sem essa variável, `available` fica false e a tela deve desabilitar
 * o botão do Google.
 */
export function useGoogleAuth(onIdToken: (idToken: string) => void) {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  // Client ID tipo Android (pacote + SHA-1): necessário para o OAuth abrir
  // no APK standalone — o client Web não aceita redirect de scheme nativo.
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: webClientId ?? '',
    ...(androidClientId ? { androidClientId } : null),
  });

  useEffect(() => {
    const idToken = response?.type === 'success' ? response.params.id_token : undefined;
    if (idToken) onIdToken(idToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  return {
    // No Android nativo, sem o client Android o Google devolve uma página
    // de erro 400 — melhor manter o botão no aviso amigável até ter os dois.
    available:
      Boolean(webClientId) &&
      Boolean(request) &&
      (Platform.OS === 'web' || Boolean(androidClientId)),
    promptAsync,
  };
}
