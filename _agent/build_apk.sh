#!/bin/bash
set -e

export ANDROID_HOME=/home/saturnin/android-sdk
export JAVA_HOME=/home/saturnin/jdk21
export PATH=/home/saturnin/jdk21/bin:/home/saturnin/android-sdk/cmdline-tools/latest/bin:/home/saturnin/android-sdk/platform-tools:/home/saturnin/android-sdk/build-tools/36.0.0:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

export KEYSTORE_PATH=/home/saturnin/care4success-release.jks
export KEYSTORE_PASS="Care4Success@2025"
export KEY_ALIAS="care4success"
export KEY_PASS="Care4Success@2025"

echo "[1/5] Extracting Android project..."
rm -rf /home/saturnin/care4success_android
mkdir -p /home/saturnin/care4success_android
tar -xzf /home/saturnin/android_project.tar.gz -C /home/saturnin/care4success_android
cd /home/saturnin/care4success_android/android

echo "[2/5] Copying keystore..."
cp /home/saturnin/care4success-release.jks app/care4success-release.jks

echo "[3/5] Making gradlew executable..."
chmod +x gradlew

echo "[4/5] Building release APK (signed)..."
ANDROID_HOME=/home/saturnin/android-sdk \
JAVA_HOME=/home/saturnin/jdk21 \
KEYSTORE_PATH=care4success-release.jks \
KEYSTORE_PASS="Care4Success@2025" \
KEY_ALIAS="care4success" \
KEY_PASS="Care4Success@2025" \
./gradlew assembleRelease --no-daemon 2>&1

echo "[5/5] Done!"
APK_PATH=$(find . -name "*.apk" -path "*/release/*" | head -1)
echo "APK: $APK_PATH"
ls -lh "$APK_PATH"
cp "$APK_PATH" /home/saturnin/care4success-release.apk
echo "APK copied to /home/saturnin/care4success-release.apk"
