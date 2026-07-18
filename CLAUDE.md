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

**Atenção**: capturas via Playwright/Chromium testam a versão **web** — não pegam bugs
específicos do Android nativo (ex.: `includeFontPadding` cortando ícones/texto, fontes
que não carregam nativamente). Para essas classes de bug, a única verificação real é
compilar o APK de verdade e inspecionar o pacote compilado (ver seção de build), e a
confirmação visual final é sempre do usuário no aparelho — não simular certeza que não se tem.

**O usuário quer o APK oficial gerado por ELE via `eas build`, não builds reduzidos
enviados por aqui no chat.** O limite de envio do chat é 30 MiB; NÃO vale a pena
sacrificar arquiteturas/qualidade só para caber nesse limite. Builds locais neste
ambiente servem para **verificação** (conferir que compila, extrair o bundle e
confirmar que os fixes entraram) — não para entrega como produto final. Sempre que
possível, garantir que o app.json/eas.json commitados produzam o build certo quando
o usuário rodar `eas build` do lado dele.

## Verificação obrigatória antes de qualquer entrega

- `npx tsc --noEmit` limpo;
- `npx expo export --platform android` conclui;
- Smoke test no Chromium (o export web + Playwright acima) sem `pageerror`;
- Para bugs suspeitos de serem Android-nativo-only: compilar o APK real aqui
  (ver seção de build) e inspecionar o `.apk` gerado (ver subseção "Verificar dentro
  do APK compilado").

## Build do APK neste ambiente (já montado)

```bash
export ANDROID_HOME=/opt/android-sdk JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64 \
       PATH=/opt/gradle-8.10.2/bin:$PATH
unset JAVA_TOOL_OPTIONS   # OBRIGATÓRIO: a injeção de proxy quebra o prefab/CMake
npx expo prebuild --platform android --no-install
echo "sdk.dir=/opt/android-sdk" > android/local.properties
cd android && gradle :app:assembleRelease --no-daemon
```

- Proxy para o Gradle: configurado em `/root/.gradle/gradle.properties` (systemProp).
  **A porta do proxy muda entre sessões** — antes de builds que baixam dependências novas
  (ex.: depois de `npx expo install <pacote novo>`), conferir `echo $HTTPS_PROXY` e
  sincronizar com `sed -i "s/proxyPort=[0-9]*/proxyPort=<porta atual>/g" /root/.gradle/gradle.properties`.
  Erro característico quando desatualizado: `Connect to 127.0.0.1:<porta velha> failed:
  Connection refused` ao resolver alguma dependência Maven.
- Gradle 8.10.2 veio do espelho Tencent (downloads de github.com são bloqueados pelo proxy).
- **Cache do Gradle não invalida quando só o `.env` muda** (o bundle JS reaproveitado fica
  sem as chaves): depois de criar/editar `.env`, rodar com `--rerun-tasks` (ou apagar
  `android/app/build/intermediates/merged_assets` e `.../generated/assets`) para forçar
  o re-bundle antes de assinar um APK que precisa das variáveis `EXPO_PUBLIC_*`.
- **R8/ProGuard + shrinkResources são SEGUROS agora** (testado e confirmado: fontes
  sobrevivem, extraídas do `.apk` e presentes em `assets/fonts/`). Habilitados via
  `expo-build-properties` no `app.json` (`enableProguardInReleaseBuilds` +
  `enableShrinkResourcesInReleaseBuilds`). A nota antiga "nunca ativar" era de um
  cenário anterior a embutir as fontes nativamente via plugin `expo-font` — não se
  aplica mais. Redução de ~20% no tamanho final.
- **Arquiteturas nativas restritas** via `plugins/withReactNativeArchitectures.js`
  (config plugin customizado, commitado): fixa `reactNativeArchitectures` no
  `gradle.properties` E injeta `ndk.abiFilters` no `build.gradle` do app — as duas
  frentes são necessárias (a primeira só cobre libs do React Native/Hermes, a segunda
  cobre todas as outras deps nativas, ex. Firebase). Atualmente restrito a
  `armeabi-v7a` + `arm64-v8a` (cobre todo Android real; só exclui x86/x86_64,
  que servem apenas para emulador). Isso já reduz o build do EAS de ~90 MB para a
  faixa de 35-40 MB sem cortar nenhum recurso do app.
- Assinatura local para testes: `zipalign` + `apksigner` com `android/app/debug.keystore`
  (senha `android`, alias `androiddebugkey`).

### Verificar dentro do APK compilado

```bash
mkdir -p /tmp/apk-check && cd /tmp/apk-check
unzip -o -q <caminho-do-apk> assets/index.android.bundle
strings assets/index.android.bundle | grep -c "includeFontPadding"   # deve ser >=1
grep -a -c "<algum-trecho-da-EXPO_PUBLIC_...>" assets/index.android.bundle  # confirma env var embutida
find . -iname "*ionicons*" -o -iname "*inter_*"    # confirma fontes nativas embutidas (via unzip -o -q <apk> -d .)
```

Cuidado ao ler saídas de múltiplos `grep`/`strings` concatenadas no mesmo bloco de
ferramenta — já aconteceu de interpretar mal qual trecho pertencia a qual comando.
Rodar comandos de verificação isoladamente quando o resultado for crítico.

## Variáveis de ambiente / segredos (Firebase, Google)

- Projeto Firebase real do usuário: `casal-3ff6f` (as chaves EXPO_PUBLIC_FIREBASE_*
  já estão no `eas.json`, dentro do profile `base` herdado por development/preview/
  production — são chaves públicas, seguras para ficar no repo; a segurança de
  verdade vem das Regras do Firestore, não do sigilo da chave).
- Firestore em **modo produção**: regras completas em `firestore.rules` (cobre
  `users/{uid}` e `couples/{id}` + subcoleções `tasks`/`activity`). A v1 foi
  publicada e verificada via curl, mas bloqueava o PAREAMENTO (query por
  inviteCode exige `allow list` para autenticados — `allow read` só de membro
  falha com "missing or insufficient permissions"). A v2 (get/list separados)
  está no repo e **JÁ FOI PUBLICADA por mim via Firebase Rules API** (18/jul,
  com a chave de conta de serviço; pareamento testado E2E via REST: query por
  código, arrayUnion de entrada, leitura como membro e do parceiro — tudo 200).
  Enquanto a chave de serviço estiver válida, publicar regras direto pela API
  (rulesets + release cloud.firestore) em vez de pedir para o usuário. O cliente
  também não pode fazer `get` do casal antes de entrar (addMemberToCouple
  recebe o doc vindo da query, não refaz a leitura).
- Login Google real CONFIGURADO por completo (18/jul): provedor ativado pelo
  usuário no console; via API (chave de conta de serviço fornecida pelo usuário
  no chat, guardada só na sessão) registrei o app Android `com.focoadois.app`
  no Firebase, cadastrei SHA-1/SHA-256 do keystore EAS e obtive os dois client
  IDs — `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` e `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
  estão no `eas.json` (profile base). NOTA: se o keystore da EAS mudar (ex.:
  conta EAS nova), o SHA-1 novo precisa ser cadastrado de novo no Firebase.
- Histórico de tentativas do Google (NÃO repetir): (1) client Web + scheme
  nativo → 400; (2) client Android via expo-auth-session (navegador) → 400
  invalid_request, porque o Google BLOQUEIA redirect de scheme customizado em
  clients Android novos. Solução final: **Google Sign-In NATIVO**
  (`@react-native-google-signin/google-signin`, plugin no app.json) no
  Android/iOS — sem navegador; `configure({ webClientId })` e o client Android
  é usado implicitamente via pacote+SHA-1. Fluxo web (expo-auth-session) só
  para Platform.OS === 'web'. Compilação local com o módulo verificada
  (RNGoogleSignin presente no dex).
- Login Apple: ainda 100% fake/demo — não implementado.

## Armadilhas já vividas (não repetir)

- Builds EAS falhavam com "Gradle build failed with unknown error": a causa real era
  `resource drawable/splashscreen_logo not found` — o projeto precisa dos assets
  `assets/icon.png`, `assets/adaptive-icon.png`, `assets/splash-icon.png` referenciados
  no `app.json`. Já corrigido; não remover.
- **Ícones "sumindo" no Android real (não aparecem, não é só corte)**: causa raiz foi
  remover o plugin `expo-font` que embute Ionicons/Inter nativamente, achando (sem
  evidência sólida) que era redundante com `useFonts()` em runtime. Para builds fora
  do Expo Go (prebuild/EAS), a Expo recomenda EXPLICITAMENTE listar as fontes
  (inclusive as de ícones) no plugin `expo-font` do `app.json` — não confiar só no
  carregamento em runtime de `@expo/vector-icons`. Não remover essa config de novo.
- Corte de topo de texto/ícones em fontes customizadas no Android (não confundir com
  o bug acima — são sintomas diferentes): `includeFontPadding: false` global via
  `src/utils/androidTextFix.ts` (patch em `Text.defaultProps`, importado no topo do
  `app/_layout.tsx`). Só reproduz em Android nativo, nunca no teste web/Playwright.
- **`AppText` ANINHADO com fontSize menor corta o texto externo no Android** (o "0%"
  do anel-herói virou "U%" no aparelho): o span interno com lineHeight menor encolhe
  a linha inteira. O auto-lineHeight do AppText não alcança esse caso. Solução:
  nunca aninhar AppText de tamanhos diferentes — usar textos irmãos numa row com
  `alignItems: 'baseline'` e lineHeight explícito.
- O usuário roda tudo no **Termux** do celular: `npm install` altera `package-lock.json`
  e faz `git pull` falhar silenciosamente → orientar `git fetch && git reset --hard origin/<branch>`
  e conferir `git log --oneline -1`.
- No EAS via Termux: `export EAS_SKIP_AUTO_FINGERPRINT=1` (o fingerprint quebra no Termux).
- **`eas build` (nuvem) nunca recebe o `.env` local** (fica de fora por estar no
  `.gitignore` — correto do ponto de vista de segurança, mas quebra a sincronização
  silenciosamente). As variáveis `EXPO_PUBLIC_FIREBASE_*` foram movidas para dentro do
  `eas.json` (profile `base`), que É versionado — é a forma correta e documentada da
  EAS de injetar env vars em builds na nuvem.
- Ícones: importar por conjunto (`@expo/vector-icons/Ionicons`), nunca o pacote inteiro.
- Componente `Card` (src/components/ui/Card.tsx): estilos de layout (width %, flex,
  margens) são movidos para o wrapper animado externo — manter esse comportamento,
  senão larguras percentuais colapsam.
- `newArchEnabled: false` no app.json — não reativar sem testar.

## Estado atual

- Branch de trabalho: `claude/foco-dois-app-design-eewn1j`.
- Firebase real conectado (Auth + Firestore), regras publicadas e funcionando. Se
  quiser Google Login funcional, falta o usuário gerar o Web Client ID (ver seção de
  variáveis). Sem isso, o botão Google cai graciosamente no fallback demo.
- Rodada atual (jul/2026): sons de conquista via `expo-av` (`src/services/sound.ts`,
  `assets/sounds/success.wav` + `fanfare.wav` sintetizados; toggle "Sons de conquista"
  nas configurações); seeding mínimo no primeiro acesso (só cronograma compartilhado
  + rotina própria — o par gera os itens dele no aparelho dele, chegam via sync);
  dashboard com anel-herói de progresso + chips; alternador de tema sol/lua no
  cabeçalho da Home; fix de emojis cortados no `AppText` (lineHeight automático
  quando o style sobrescreve fontSize sem lineHeight); "Para quem?" ao criar tarefa
  individual (permite criar tarefa para o par); `authStore` com fallback local se o
  Firestore falhar no login/cadastro.
- Rodada de correções pós-teste real (18/jul): regras v2 do Firestore (pareamento —
  PRECISA REPUBLICAR no console); "0%" do anel cortado no Android (AppText aninhado
  → textos irmãos); botões Google/Apple com Firebase real mostram aviso em vez do
  fallback demo (que criava conta falsa por cima da real); rotina aceita qualquer
  horário digitado (usuário trabalha à noite) com normalização HH:MM; lembretes
  locais de tarefas via `src/services/reminders.ts` (reagenda tudo com debounce no
  layout das tabs; cada aparelho notifica as tarefas do próprio usuário).
- Rodada (18/jul, à noite): tarefas básicas fixas todo dia (acordar, escovar os dentes
  manhã/noite, 2 L de água em 4 sessões, pequeno-almoço, jantar; louça/roupa alternando
  de 2 em 2 dias) via `src/domain/schedule.ts`; ids de seed determinísticos (tasks e
  rewards) para os dois aparelhos gerarem os MESMOS itens sem duplicar na sincronização;
  login Google agora com `GoogleSignin.signOut()` antes do `signIn()` para sempre abrir
  o seletor de contas (a Juliana caía direto na conta do Anderson); `Task.completedById`
  registra quem deu a conclusão final — placar em Relatórios conta quem CONCLUIU, não o
  responsável original ("é tipo um jogo, quem ganhar mais pontos ganha"); loja de
  recompensas sincronizada de verdade (`couples/{id}/rewards` e `/redemptions` no
  Firestore, regras publicadas e testadas E2E); notificação local quando o par cria
  tarefa atribuída a você ou resgata uma recompensa (sem servidor push — só funciona
  com o app aberto/em 2º plano no aparelho de quem recebe).
- Próximos passos combinados: usuário vai gerar o APK oficial via `eas build` (não mais
  builds reduzidos entregues pelo chat) e testar no aparelho; ajustar conforme feedback
  de capturas de tela. O usuário NÃO pretende publicar na Play Store — "nível Play
  Store" era sentido figurado, o padrão de qualidade é que deve ser alto.
