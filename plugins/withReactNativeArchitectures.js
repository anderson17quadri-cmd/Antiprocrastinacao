const { withGradleProperties, withAppBuildGradle } = require('@expo/config-plugins');

const ABIS = ['armeabi-v7a', 'arm64-v8a'];

/**
 * Restringe as arquiteturas nativas empacotadas no APK a arm64-v8a e
 * armeabi-v7a (cobre praticamente todo Android real dos últimos ~8 anos).
 * Sem isso o Expo empacota as 4 arquiteturas (incluindo x86/x86_64, que
 * só servem para emuladores), inflando o APK.
 *
 * Duas frentes, porque uma sozinha não basta:
 *  1. `reactNativeArchitectures` no gradle.properties — controla as
 *     libs nativas do próprio React Native/Hermes.
 *  2. `ndk.abiFilters` no build.gradle do app — controla TODAS as
 *     outras dependências nativas (Firebase, etc.), que ignoram a
 *     property acima.
 */
module.exports = function withReactNativeArchitectures(config) {
  config = withGradleProperties(config, (config) => {
    const key = 'reactNativeArchitectures';
    const value = ABIS.join(',');
    const existing = config.modResults.find((item) => item.type === 'property' && item.key === key);
    if (existing) {
      existing.value = value;
    } else {
      config.modResults.push({ type: 'property', key, value });
    }
    return config;
  });

  config = withAppBuildGradle(config, (config) => {
    const marker = 'ndk { abiFilters';
    if (!config.modResults.contents.includes(marker)) {
      const abiFiltersBlock = `\n        ndk {\n            abiFilters ${ABIS.map((a) => `"${a}"`).join(', ')}\n        }\n`;
      config.modResults.contents = config.modResults.contents.replace(
        /defaultConfig\s*\{/,
        (match) => `${match}${abiFiltersBlock}`,
      );
    }
    return config;
  });

  return config;
};
