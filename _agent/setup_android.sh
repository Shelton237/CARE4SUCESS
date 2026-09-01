#!/bin/bash
export ANDROID_HOME=/home/saturnin/android-sdk
export PATH=/home/saturnin/android-sdk/cmdline-tools/latest/bin:/home/saturnin/android-sdk/platform-tools:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

echo "[1/3] Accepting licenses..."
yes | sdkmanager --licenses > /dev/null 2>&1
echo "Done"

echo "[2/3] Installing SDK packages..."
sdkmanager "platform-tools" "platforms;android-36" "build-tools;36.0.0" 2>&1 | grep -E "done|error|Error|100%" | head -20
echo "Done"

echo "[3/3] Verifying..."
ls /home/saturnin/android-sdk/build-tools/36.0.0/aapt2 && echo "build-tools OK" || echo "build-tools MISSING"
ls /home/saturnin/android-sdk/platforms/android-36/android.jar && echo "platform-36 OK" || echo "platform MISSING"
