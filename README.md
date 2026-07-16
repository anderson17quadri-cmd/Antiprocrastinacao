# FOCO A DOIS 💜

> **Juntos contra a procrastinação.**

Aplicativo Android (Expo + React Native + TypeScript) de produtividade para casais: rotina
compartilhada, cronômetro por tarefa, gamificação com XP/moedas, loja de recompensas, desafios,
liga do casal, relatórios e um assistente inteligente — tudo sincronizado em tempo real entre os
dois usuários e com funcionamento offline.

## ✨ Funcionalidades

| Área | O que faz |
| --- | --- |
| **Splash + Login** | Logo animada, e-mail/senha, Google e Apple, criação de conta |
| **Casal** | Conta com exatamente 2 usuários, convite por código (`FOCO-XXXX`), dados idênticos para os dois |
| **Home** | Saudação, calendário horizontal, progresso do dia, sequência 🔥, pontuação 🏆, produtividade ❤️, tarefas do dia |
| **Cronograma padrão** | Rotina pronta (07:00 Acordar → 22:30 Dormir), totalmente personalizável |
| **Calendário** | Modos Dia / Semana / Mês com cores por status (concluída, pendente, cancelada) |
| **Cronômetro** | Timer persistente por tarefa (sobrevive à navegação e ao fechamento do app), registro do tempo gasto |
| **Notificações** | Feed em tempo real: "Juliana iniciou a tarefa Almoço.", "Anderson concluiu Limpar Cozinha." |
| **Relatórios** | Hoje/Semana/Mês/Ano: tarefas concluídas, horas produtivas, tempo desperdiçado, produtividade (progress ring), gráfico semanal (Victory), ranking e estatísticas detalhadas |
| **Gamificação** | XP por dificuldade, moedas 🪙, níveis, conquistas, medalhas, sequência, objetivos |
| **Loja de Recompensas** | Recompensas personalizadas (🍕 jantar, 🎬 filme, 💆 massagem…), resgate com moedas, histórico, notificação ao par |
| **Desafios** | Automáticos: 20/100/500 tarefas, lavar roupa 10×, 7/30 dias consecutivos — com XP, moedas e confetes |
| **Liga do Casal** | Bronze → Prata → Ouro → Platina → Diamante → Mestre → Lenda, com desbloqueios cosméticos |
| **Tarefas da Casa** | Lista pronta (lavar roupa, limpar cozinha, mercado…) com prioridade, tempo médio, repetição e XP |
| **Assistente IA** | Analisa hábitos do casal: melhor horário, divisão justa, tarefas esquecidas, alerta de procrastinação, resumo semanal |
| **Configurações** | Tema (escuro/claro/sistema), idioma, notificações, backup, exportar dados, excluir conta |
| **Animações** | Reanimated: cards deslizando, ripple, progress ring animado, confetes ao concluir o dia 🎉 |

## 🧱 Stack

Expo SDK 52 · React Native 0.76 · TypeScript (strict) · Expo Router · React Query · Zustand +
AsyncStorage · React Hook Form · Reanimated 3 · Gesture Handler · Victory Native · DayJS (pt-BR) ·
Expo Notifications · Expo Calendar · Firebase (Auth + Firestore)

## 🏛️ Arquitetura (Clean Architecture)

```
src/
├── domain/        # Entidades e regras puras (Task, Reward, Challenge, gamificação, estatísticas)
├── constants/     # Seeds: cronograma padrão, tarefas da casa, recompensas, desafios, categorias
├── stores/        # Estado (Zustand persistido): auth, tarefas, timer, recompensas, configurações
├── services/      # Infra: Firebase, sincronização offline-first, notificações, insights (IA)
├── components/    # UI reutilizável (Card, ProgressRing, Confetti…) e componentes de feature
├── hooks/         # Hooks utilitários
├── theme/         # Design tokens: cores da marca, tipografia Inter, sombras, raios
└── utils/         # Datas (dayjs pt-BR), formatação, ids

app/               # Rotas (Expo Router): (auth), (tabs), task/, rewards, insights…
```

- **Offline-first**: o estado local (Zustand + AsyncStorage) é a fonte de verdade imediata. Cada
  mutação é espelhada no Firestore; sem conexão, entra numa fila persistida e é reenviada ao voltar.
- **Tempo real**: `subscribeToCouple` escuta snapshots do Firestore e aplica as mudanças do parceiro.
- **Sem Firebase configurado** o app roda 100% em modo local (ótimo para demonstração).

## 🚀 Rodando

```bash
npm install
npm start            # Expo Go / dev client
npm run typecheck    # verificação TypeScript
```

### Firebase (opcional, para sincronização real)

Crie um projeto no [Firebase Console](https://console.firebase.google.com), habilite
**Authentication** (Email/Password, Google, Apple) e **Cloud Firestore**, e defina num `.env`:

```
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

> Para push entre dispositivos (FCM), publique uma Cloud Function que escute
> `couples/{id}/activity` e envie a notificação ao token do parceiro.

### Gerando o APK

```bash
npm install -g eas-cli
eas login
npm run build:apk    # eas build -p android --profile preview  →  gera .apk instalável
```

## 🎨 Design

Dark/Light mode, glassmorphism leve, cards arredondados, sombras suaves e tipografia **Inter**.
Paleta: `#6C63FF` · `#7E57FF` · `#A78BFA` · `#F5F5F5` · `#FFFFFF` · `#101010`.
