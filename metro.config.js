const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// 🔹 Solo redirigir en móvil (ios/android), nunca en web
if (process.env.EXPO_OS !== "web") {
  config.resolver.alias = {
    ...(config.resolver.alias || {}),
    "firebase/auth/react-native": path.resolve(__dirname, "firebaseAuthStub.js"),
  };
}

module.exports = config;
