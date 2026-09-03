#!/bin/bash
set -e

JDK_URL="https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.5%2B11/OpenJDK21U-jdk_x64_linux_hotspot_21.0.5_11.tar.gz"
DEST=/home/saturnin/jdk21

if [ -f "$DEST/bin/java" ]; then
  echo "Java 21 already installed at $DEST"
  $DEST/bin/java -version
  exit 0
fi

echo "[1/3] Downloading Java 21..."
wget -q --show-progress -O /tmp/jdk21.tar.gz "$JDK_URL"

echo "[2/3] Extracting..."
mkdir -p "$DEST"
tar -xzf /tmp/jdk21.tar.gz -C "$DEST" --strip-components=1
rm /tmp/jdk21.tar.gz

echo "[3/3] Verify..."
$DEST/bin/java -version
echo "Java 21 installed OK"
