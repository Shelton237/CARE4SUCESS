#!/bin/bash
export JAVA_HOME=/home/saturnin/jdk21
export PATH=/home/saturnin/jdk21/bin:$PATH

KEYSTORE=/home/saturnin/care4success-release.jks
KEY_ALIAS=care4success
STORE_PASS=Care4Success@2025
KEY_PASS=Care4Success@2025

if [ -f "$KEYSTORE" ]; then
  echo "Keystore already exists at $KEYSTORE"
  keytool -list -keystore "$KEYSTORE" -storepass "$STORE_PASS" -noprompt
  exit 0
fi

echo "Generating keystore..."
keytool -genkeypair \
  -v \
  -keystore "$KEYSTORE" \
  -alias "$KEY_ALIAS" \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass "$STORE_PASS" \
  -keypass "$KEY_PASS" \
  -dname "CN=Care4Success, OU=Mobile, O=USRA-CARE, L=Yaounde, ST=Centre, C=CM"

echo "Keystore generated at $KEYSTORE"
keytool -list -keystore "$KEYSTORE" -storepass "$STORE_PASS" -noprompt
