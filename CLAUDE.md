# Foco a Dois — Memória do projeto

App Android (Expo SDK 52 + React Native 0.76 + TypeScript + Expo Router) de produtividade
para casais. Idioma do produto e da comunicação com o usuário (Anderson): **português**.

## ⭐ Combinado de trabalho com o usuário (NUNCA esquecer)

**Design é iterado com capturas de tela ANTES de gerar APK.**

1. Fazer as mudanças de UI.
2. Rodar o app de verdade e tirar capturas: `npx expo export --platform web` →
   servir `dist` → Playwright/Chromium headless (viewport 390×844, deviceScaleFactor 2),
   fazer login demo (qualquer e-mail/senha) e navegar pelas telas.
3. **Enviar as capturas ao usuário e esperar o feedback/aprovação.**
4. Só depois de aprovado, gerar e enviar o APK.

Nunca entregar APK sem ter validado o visual com capturas. O usuário avalia o design
olhando imagens, não instalando às cegas.

## Verificação obrigatória antes de qualquer entrega

- `npx tsc --noEmit` limpo;
- `npx expo export --platform android` conclui;
- Smoke test no Chromium (o export web + Playwright acima) sem `pageerror`.

## Build do APK neste ambiente (já montado)

```bash
export ANDROID_HOME=/opt/android-sdk JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64 \
       PATH=/opt/gradle-8.10.2/bin:$PATH
unset JAVA_TOOL_OPTIONS   # OBRIGATÓRIO: a injeção de proxy quebra o prefab/CMake
npx expo prebuild --platform android --no-install
echo "sdk.dir=/opt/android-sdk" > android/local.properties
cd android && gradle :app:assembleRelease --no-daemon
```

- Proxy para o Gradle: já configurado em `/root/.gradle/gradle.properties` (systemProp).
- Gradle 8.10.2 veio do espelho Tencent (downloads de github.com são bloqueados pelo proxy).
- Para enviar APK ao usuário (limite 30 MiB): `ndk { abiFilters "arm64-v8a" }` no
  `android/app/build.gradle` + remover do zip as fontes de ícones não usadas (manter
  Ionicons e Inter) + `zipalign` + `apksigner` com `android/app/debug.keystore`
  (senha `android`, alias `androiddebugkey`).
- **NUNCA ativar `enableProguardInReleaseBuilds` / `shrinkResources`**: o shrinker
  remove as fontes (ícones/Inter) do APK e quebra a UI inteira.

## Armadilhas já vividas (não repetir)

- Builds EAS falhavam com "Gradle build failed with unknown error": a causa real era
  `resource drawable/splashscreen_logo not found` — o projeto precisa dos assets
  `assets/icon.png`, `assets/adaptive-icon.png`, `assets/splash-icon.png` referenciados
  no `app.json`. Já corrigido; não remover.
- O usuário roda tudo no **Termux** do celular: `npm install` altera `package-lock.json`
  e faz `git pull` falhar silenciosamente → orientar `git fetch && git reset --hard origin/<branch>`
  e conferir `git log --oneline -1`.
- No EAS via Termux: `export EAS_SKIP_AUTO_FINGERPRINT=1` (o fingerprint quebra no Termux).
- Ícones: importar por conjunto (`@expo/vector-icons/Ionicons`), nunca o pacote inteiro.
- Componente `Card` (src/components/ui/Card.tsx): estilos de layout (width %, flex,
  margens) são movidos para o wrapper animado externo — manter esse comportamento,
  senão larguras percentuais colapsam.
- `newArchEnabled: false` no app.json — não reativar sem testar.

## Estado atual

- Branch de trabalho: `claude/foco-dois-app-design-eewn1j`.
- App roda em modo local/demo (Firebase não configurado; login aceita qualquer credencial,
  parceira "Juliana" é simulada). Sincronização real requer `EXPO_PUBLIC_FIREBASE_*` (.env).
- Próximos passos combinados: iterações de design com capturas; depois Firebase real
  (sincronização do casal em tempo real); o usuário NÃO pretende publicar na Play Store —
  "nível Play Store" era sentido figurado, o padrão de qualidade é que deve ser alto.
