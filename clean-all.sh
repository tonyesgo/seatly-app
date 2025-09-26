#!/bin/bash

echo "🧹 Limpiando proyecto Seatly..."

# Salir si hay errores
set -e

# 1. Eliminar node_modules y lockfiles
echo "   ➡️ Borrando node_modules y lockfiles..."
rm -rf node_modules
rm -f package-lock.json yarn.lock pnpm-lock.yaml

# 2. Eliminar cachés globales de Gradle
echo "   ➡️ Borrando caches globales de Gradle..."
rm -rf $HOME/.gradle/caches
rm -rf $HOME/.gradle/daemon
rm -rf $HOME/.gradle/kotlin-dsl

# 3. Eliminar cachés locales de Android
echo "   ➡️ Borrando caches locales de Android..."
rm -rf android/.gradle
rm -rf android/build

# 4. Reinstalar dependencias
echo "   ➡️ Reinstalando dependencias..."
npm install

# 5. Limpiar Gradle
echo "   ➡️ Limpiando Gradle..."
cd android
./gradlew clean --no-daemon

# 6. Reconstruir con refresh
echo "   ➡️ Reconstruyendo proyecto..."
./gradlew assembleDebug --refresh-dependencies --no-daemon

echo "✅ Limpieza y compilación completadas"
