/**
 * Sons de conquista (expo-av). Curtinhos, gerados sob medida para o app:
 *  - success: ding ao concluir uma tarefa;
 *  - fanfare: fanfarra ao completar o dia ou resgatar recompensa.
 */
import { Audio } from 'expo-av';
import { useSettingsStore } from '@/stores/settingsStore';

type SoundName = 'success' | 'fanfare';

const SOURCES: Record<SoundName, number> = {
  success: require('../../assets/sounds/success.wav'),
  fanfare: require('../../assets/sounds/fanfare.wav'),
};

let configured = false;

async function ensureMode(): Promise<void> {
  if (configured) return;
  configured = true;
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: false,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  }).catch(() => undefined);
}

export function playSound(name: SoundName): void {
  if (!useSettingsStore.getState().soundEnabled) return;
  void (async () => {
    try {
      await ensureMode();
      const { sound } = await Audio.Sound.createAsync(SOURCES[name], { volume: 0.8 });
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) void sound.unloadAsync();
      });
    } catch {
      // Som é um extra: nunca pode quebrar o fluxo.
    }
  })();
}
