const { withGradleProperties } = require('@expo/config-plugins');

/**
 * Restringe as arquiteturas nativas empacotadas no APK a arm64-v8a e
 * armeabi-v7a (cobre praticamente todo Android real dos últimos ~8 anos).
 * Sem isso o Expo empacota as 4 arquiteturas (incluindo x86/x86_64, que
 * só servem para emuladores), inflando o APK para ~90 MB.
 */
module.exports = function withReactNativeArchitectures(config) {
  return withGradleProperties(config, (config) => {
    const key = 'reactNativeArchitectures';
    const value = 'armeabi-v7a,arm64-v8a';
    const existing = config.modResults.find((item) => item.type === 'property' && item.key === key);
    if (existing) {
      existing.value = value;
    } else {
      config.modResults.push({ type: 'property', key, value });
    }
    return config;
  });
};
