#!/bin/bash
# Signs and uploads the First Week iPhone app on a GitHub macOS runner.
# Two ways to sign:
#   manual    - IOS_CERTIFICATE_BASE64, IOS_CERTIFICATE_PASSWORD and IOS_PROFILE_BASE64 are set
#               (an App Store profile for com.playfirstweek.app), the same way Blink Stop signs.
#   automatic - those are empty; Xcode signs with the App Store Connect API key
#               (ASC_KEY_ID, ASC_ISSUER_ID, ASC_PRIVATE_KEY_BASE64), which needs an Admin key.
set -euo pipefail
umask 077
FW_SIGNING_DIR="$RUNNER_TEMP/first-week-ios-signing"
FW_KEYCHAIN="$FW_SIGNING_DIR/signing.keychain-db"
FW_PROFILE_DIR="$HOME/Library/MobileDevice/Provisioning Profiles"
FW_BUNDLE_ID="com.playfirstweek.app"

signing_mode() {
  if [[ -n "${IOS_PROFILE_BASE64:-}" ]]; then echo manual; else echo automatic; fi
}

write_api_key() {
  for FW_SECRET_NAME in ASC_KEY_ID ASC_ISSUER_ID ASC_PRIVATE_KEY_BASE64; do
    if [[ -z "${!FW_SECRET_NAME:-}" ]]; then echo "Missing GitHub environment secret: $FW_SECRET_NAME"; exit 1; fi
  done
  mkdir -p "$HOME/.appstoreconnect/private_keys"
  python3 - <<'PY'
import base64, os, re
from pathlib import Path
key_id = os.environ['ASC_KEY_ID']
if not re.fullmatch(r'[A-Z0-9]{10}', key_id):
    raise SystemExit('Invalid App Store Connect key identifier')
try:
    key = base64.b64decode(os.environ['ASC_PRIVATE_KEY_BASE64'], validate=True)
except Exception:
    raise SystemExit('ASC_PRIVATE_KEY_BASE64 is not valid single-line Base64')
if b'-----BEGIN PRIVATE KEY-----' not in key:
    raise SystemExit('Expected an App Store Connect .p8 private key')
(Path.home() / '.appstoreconnect/private_keys' / ('AuthKey_' + key_id + '.p8')).write_bytes(key)
PY
}

api_key_path() { echo "$HOME/.appstoreconnect/private_keys/AuthKey_$ASC_KEY_ID.p8"; }

case "${1:-}" in
  install)
    if [[ -z "${APPLE_TEAM_ID:-}" ]]; then echo 'Missing GitHub variable: APPLE_TEAM_ID'; exit 1; fi
    mkdir -p "$FW_SIGNING_DIR" "$FW_PROFILE_DIR"
    if [[ "$(signing_mode)" == automatic ]]; then
      write_api_key
      python3 - "$APPLE_TEAM_ID" "$FW_SIGNING_DIR/ExportOptions.plist" "$FW_BUNDLE_ID" <<'PY'
import plistlib, re, sys
team, path, bundle = sys.argv[1:]
if not re.fullmatch(r'[A-Z0-9]{10}', team):
    raise SystemExit('APPLE_TEAM_ID must be a ten-character team identifier')
options = {'method': 'app-store-connect', 'destination': 'export', 'teamID': team,
           'signingStyle': 'automatic', 'manageAppVersionAndBuildNumber': False, 'uploadSymbols': False}
open(path, 'wb').write(plistlib.dumps(options))
PY
      echo 'Signing automatically with the App Store Connect API key.'
      exit 0
    fi
    for FW_SECRET_NAME in IOS_CERTIFICATE_BASE64 IOS_CERTIFICATE_PASSWORD IOS_PROFILE_BASE64; do
      if [[ -z "${!FW_SECRET_NAME:-}" ]]; then echo "Missing GitHub environment setting: $FW_SECRET_NAME"; exit 1; fi
    done
    python3 - <<'PY'
import base64, os
from pathlib import Path
p = Path(os.environ['RUNNER_TEMP']) / 'first-week-ios-signing'
for variable, filename in [('IOS_CERTIFICATE_BASE64','distribution.p12'),('IOS_PROFILE_BASE64','profile.mobileprovision')]:
    try:
        payload = base64.b64decode(os.environ[variable], validate=True)
    except Exception:
        raise SystemExit(variable + ' is not valid single-line Base64')
    (p / filename).write_bytes(payload)
PY
    security cms -D -i "$FW_SIGNING_DIR/profile.mobileprovision" > "$FW_SIGNING_DIR/profile.plist"
    python3 scripts/ios-signing-config.py "$FW_SIGNING_DIR/profile.plist" "$APPLE_TEAM_ID" \
      ios/App/App.xcodeproj/project.pbxproj "$FW_SIGNING_DIR/ExportOptions.plist" > "$FW_SIGNING_DIR/profile-uuid"
    FW_PROFILE_UUID="$(cat "$FW_SIGNING_DIR/profile-uuid")"
    cp "$FW_SIGNING_DIR/profile.mobileprovision" "$FW_PROFILE_DIR/$FW_PROFILE_UUID.mobileprovision"
    FW_KEYCHAIN_PASSWORD="$(openssl rand -hex 32)"
    security create-keychain -p "$FW_KEYCHAIN_PASSWORD" "$FW_KEYCHAIN"
    security set-keychain-settings -lut 21600 "$FW_KEYCHAIN"
    security unlock-keychain -p "$FW_KEYCHAIN_PASSWORD" "$FW_KEYCHAIN"
    security import "$FW_SIGNING_DIR/distribution.p12" -P "$IOS_CERTIFICATE_PASSWORD" -A -t cert -f pkcs12 -k "$FW_KEYCHAIN" >/dev/null
    security set-key-partition-list -S apple-tool:,apple: -k "$FW_KEYCHAIN_PASSWORD" "$FW_KEYCHAIN" >/dev/null
    security list-keychains -d user -s "$FW_KEYCHAIN" "$HOME/Library/Keychains/login.keychain-db"
    echo 'Signing manually with the uploaded certificate and profile.'
    ;;
  archive)
    FW_EXTRA=()
    if [[ "$(signing_mode)" == automatic ]]; then
      FW_EXTRA=(-allowProvisioningUpdates -authenticationKeyPath "$(api_key_path)"
        -authenticationKeyID "$ASC_KEY_ID" -authenticationKeyIssuerID "$ASC_ISSUER_ID"
        CODE_SIGN_STYLE=Automatic DEVELOPMENT_TEAM="$APPLE_TEAM_ID")
    fi
    xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release \
      -sdk iphoneos -destination 'generic/platform=iOS' -archivePath build/ios-signed/App.xcarchive \
      CURRENT_PROJECT_VERSION="$GITHUB_RUN_NUMBER.$GITHUB_RUN_ATTEMPT" ${FW_EXTRA[@]+"${FW_EXTRA[@]}"} archive > "$FW_SIGNING_DIR/archive.log" 2>&1 || {
        echo 'Signed archive failed. Private signing logs are not published; check the certificate, profile or API key role and the team settings.'
        grep -E 'error:' "$FW_SIGNING_DIR/archive.log" | grep -viE 'key|password|certificate data' | head -5 || true
        exit 1;
      }
    ;;
  export)
    FW_EXTRA=()
    if [[ "$(signing_mode)" == automatic ]]; then
      FW_EXTRA=(-allowProvisioningUpdates -authenticationKeyPath "$(api_key_path)"
        -authenticationKeyID "$ASC_KEY_ID" -authenticationKeyIssuerID "$ASC_ISSUER_ID")
    fi
    xcodebuild -exportArchive -archivePath build/ios-signed/App.xcarchive \
      -exportPath build/ios-signed/export -exportOptionsPlist "$FW_SIGNING_DIR/ExportOptions.plist" \
      ${FW_EXTRA[@]+"${FW_EXTRA[@]}"} > "$FW_SIGNING_DIR/export.log" 2>&1 || {
        echo 'IPA export failed. Check the App Store distribution certificate, profile or API key role.'
        grep -E 'error:' "$FW_SIGNING_DIR/export.log" | grep -viE 'key|password|certificate data' | head -5 || true
        exit 1;
      }
    ;;
  upload)
    write_api_key
    xcrun altool --validate-app --file build/ios-signed/export/App.ipa --type ios \
      --apiKey "$ASC_KEY_ID" --apiIssuer "$ASC_ISSUER_ID" > "$FW_SIGNING_DIR/validate.log" 2>&1 || {
        echo 'Apple binary validation failed. Check that a First Week app record exists for com.playfirstweek.app, the agreements, export compliance and API-key permissions.'; exit 1;
      }
    xcrun altool --upload-app --file build/ios-signed/export/App.ipa --type ios \
      --apiKey "$ASC_KEY_ID" --apiIssuer "$ASC_ISSUER_ID" > "$FW_SIGNING_DIR/upload.log" 2>&1 || {
        echo 'Apple upload failed. Check the app record, build number and API-key permissions.'; exit 1;
      }
    echo 'Build uploaded for Apple processing. This does not submit an App Store release or invite testers.'
    ;;
  cleanup)
    security delete-keychain "$FW_KEYCHAIN" >/dev/null 2>&1 || true
    if [[ -f "$FW_SIGNING_DIR/profile-uuid" ]]; then
      FW_PROFILE_UUID="$(cat "$FW_SIGNING_DIR/profile-uuid")"
      if [[ "$FW_PROFILE_UUID" =~ ^[A-Fa-f0-9-]{36}$ ]]; then rm -f "$FW_PROFILE_DIR/$FW_PROFILE_UUID.mobileprovision"; fi
    fi
    if [[ -n "${ASC_KEY_ID:-}" && "$ASC_KEY_ID" =~ ^[A-Z0-9]{10}$ ]]; then rm -f "$HOME/.appstoreconnect/private_keys/AuthKey_$ASC_KEY_ID.p8"; fi
    rm -rf "$FW_SIGNING_DIR"
    ;;
  *) echo 'Usage: ios-cloud-sign.sh install|archive|export|upload|cleanup'; exit 2 ;;
esac
