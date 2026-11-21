#!/usr/bin/env bash
# =============================================================================
# NIGHT SHIFT: ICE CREAM — Standalone Android APK Builder
# Compiles resources (aapt2), Java source (javac -> d8), bundles offline HTML5
# game assets into assets/www/, aligns (zipalign), and signs (apksigner v1/v2/v3).
# =============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ANDROID_DIR="$ROOT_DIR/android/app/src/main"
BUILD_DIR="/tmp/night-shift-apk-build"
OUT_DIR="$ROOT_DIR/dist"
OUT_APK="$OUT_DIR/NightShiftIceCream-v2.0.0.apk"

ANDROID_HOME="${ANDROID_HOME:-/tmp/android-sdk}"
BUILD_TOOLS="${BUILD_TOOLS:-$ANDROID_HOME/build-tools/34.0.0}"
PLATFORM_JAR="${PLATFORM_JAR:-$ANDROID_HOME/platforms/android-34/android.jar}"

AAPT2="$BUILD_TOOLS/aapt2"
D8="$BUILD_TOOLS/d8"
ZIPALIGN="$BUILD_TOOLS/zipalign"
APKSIGNER="$BUILD_TOOLS/apksigner"

for tool in "$AAPT2" "$D8" "$ZIPALIGN" "$APKSIGNER" "$PLATFORM_JAR"; do
  if [ ! -e "$tool" ]; then
    echo "ERROR: Missing Android SDK tool/file: $tool" >&2
    exit 1
  fi
done

echo "[1/7] Preparing clean build staging directory..."
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"/{compiled_res,gen,classes,dex,assets/www} "$OUT_DIR"

echo "[2/7] Bundling offline HTML5 game assets into assets/www/..."
cp "$ROOT_DIR/index.html" "$BUILD_DIR/assets/www/"
cp -R "$ROOT_DIR/css" "$BUILD_DIR/assets/www/"
cp -R "$ROOT_DIR/js" "$BUILD_DIR/assets/www/"
cp -R "$ROOT_DIR/assets" "$BUILD_DIR/assets/www/"

echo "[3/7] Compiling Android resources with aapt2..."
"$AAPT2" compile --dir "$ANDROID_DIR/res" -o "$BUILD_DIR/compiled_res/res.zip"

echo "[4/7] Linking manifest, resources, and web assets..."
"$AAPT2" link \
  -o "$BUILD_DIR/unaligned.apk" \
  -I "$PLATFORM_JAR" \
  --manifest "$ANDROID_DIR/AndroidManifest.xml" \
  --java "$BUILD_DIR/gen" \
  -A "$BUILD_DIR/assets" \
  --min-sdk-version 24 \
  --target-sdk-version 34 \
  --version-code 2 \
  --version-name "2.0.0" \
  --auto-add-overlay \
  "$BUILD_DIR/compiled_res/res.zip"

echo "[5/7] Compiling Java sources and converting to Dalvik bytecode (classes.dex)..."
find "$ANDROID_DIR/java" "$BUILD_DIR/gen" -name '*.java' > "$BUILD_DIR/sources.txt"
javac \
  --release 11 \
  -classpath "$PLATFORM_JAR" \
  -d "$BUILD_DIR/classes" \
  @"$BUILD_DIR/sources.txt"

"$D8" \
  --min-api 24 \
  --lib "$PLATFORM_JAR" \
  --output "$BUILD_DIR/dex" \
  $(find "$BUILD_DIR/classes" -name '*.class')

echo "[6/7] Injecting classes.dex into APK and zip-aligning..."
python3 - "$BUILD_DIR/unaligned.apk" "$BUILD_DIR/dex/classes.dex" <<'PY'
import sys, zipfile
apk_path, dex_path = sys.argv[1], sys.argv[2]
with zipfile.ZipFile(apk_path, 'a', compression=zipfile.ZIP_DEFLATED) as zf:
    zf.write(dex_path, 'classes.dex')
PY

"$ZIPALIGN" -f -p 4 "$BUILD_DIR/unaligned.apk" "$BUILD_DIR/aligned.apk"

echo "[7/7] Signing APK with APK Signature Scheme v1/v2/v3..."
KEYSTORE="${APK_KEYSTORE:-/tmp/night-shift-release.keystore}"
KEY_ALIAS="${APK_KEY_ALIAS:-nightshift}"
KEY_PASS="${APK_KEY_PASS:-nightshift2026}"

if [ ! -f "$KEYSTORE" ]; then
  keytool -genkeypair -noprompt \
    -keystore "$KEYSTORE" \
    -alias "$KEY_ALIAS" \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -storepass "$KEY_PASS" \
    -keypass "$KEY_PASS" \
    -dname "CN=Night Shift Ice Cream, OU=Indie Games, O=Ryn-debugging, L=Jakarta, S=DKI, C=ID"
fi

"$APKSIGNER" sign \
  --ks "$KEYSTORE" \
  --ks-key-alias "$KEY_ALIAS" \
  --ks-pass "pass:$KEY_PASS" \
  --key-pass "pass:$KEY_PASS" \
  --v1-signing-enabled true \
  --v2-signing-enabled true \
  --v3-signing-enabled true \
  --v4-signing-enabled false \
  --out "$OUT_APK" \
  "$BUILD_DIR/aligned.apk"

rm -f "${OUT_APK}.idsig"

echo "Verifying signed APK..."
"$APKSIGNER" verify --verbose "$OUT_APK"
echo ""
echo "APK built successfully: $OUT_APK"
ls -lh "$OUT_APK"
sha256sum "$OUT_APK"
