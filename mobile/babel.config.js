module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    plugins: [
      // Worklets must be listed LAST — it transforms function-shaped values
      // that other plugins might still want to touch.
      'react-native-worklets/plugin',
    ],
  };
};
