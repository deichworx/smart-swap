#!/bin/bash
#
# Smart Swap Android Emulator Manager
# Erstellt und startet den konfigurierten Android Emulator
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$PROJECT_DIR/emulator.config.json"

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Android SDK Pfad finden
find_android_sdk() {
    if [ -n "$ANDROID_HOME" ]; then
        echo "$ANDROID_HOME"
    elif [ -n "$ANDROID_SDK_ROOT" ]; then
        echo "$ANDROID_SDK_ROOT"
    elif [ -d "$HOME/Library/Android/sdk" ]; then
        echo "$HOME/Library/Android/sdk"
    elif [ -d "$HOME/Android/Sdk" ]; then
        echo "$HOME/Android/Sdk"
    else
        echo ""
    fi
}

ANDROID_SDK=$(find_android_sdk)

if [ -z "$ANDROID_SDK" ]; then
    echo -e "${RED}Error: Android SDK nicht gefunden${NC}"
    echo "Setze ANDROID_HOME oder ANDROID_SDK_ROOT environment variable"
    exit 1
fi

EMULATOR="$ANDROID_SDK/emulator/emulator"
AVDMANAGER="$ANDROID_SDK/cmdline-tools/latest/bin/avdmanager"
SDKMANAGER="$ANDROID_SDK/cmdline-tools/latest/bin/sdkmanager"
ADB="$ANDROID_SDK/platform-tools/adb"

# Fallback für avdmanager
if [ ! -f "$AVDMANAGER" ]; then
    AVDMANAGER="$ANDROID_SDK/tools/bin/avdmanager"
fi

# Konfiguration laden
if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}Error: $CONFIG_FILE nicht gefunden${NC}"
    exit 1
fi

# JSON parsen (benötigt jq oder node)
parse_config() {
    if command -v jq &> /dev/null; then
        jq -r "$1" "$CONFIG_FILE"
    else
        node -e "console.log(require('$CONFIG_FILE')$2)"
    fi
}

AVD_NAME=$(parse_config '.name' "['name']")
DEVICE=$(parse_config '.device' "['device']")
API_LEVEL=$(parse_config '.apiLevel' "['apiLevel']")
SYSTEM_IMAGE=$(parse_config '.systemImage' "['systemImage']")
ARCH=$(parse_config '.arch' "['arch']")
RAM=$(parse_config '.ram // 4096' "['ram'] || 4096")
GPU=$(parse_config '.gpu // "auto"' "['gpu'] || 'auto'")

# System Image Package Name
SYSTEM_IMAGE_PKG="system-images;android-${API_LEVEL};${SYSTEM_IMAGE};${ARCH}"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Smart Swap Emulator Manager${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  AVD Name:      ${GREEN}$AVD_NAME${NC}"
echo -e "  Device:        $DEVICE"
echo -e "  API Level:     $API_LEVEL"
echo -e "  System Image:  $SYSTEM_IMAGE ($ARCH)"
echo -e "  RAM:           ${RAM}MB"
echo ""

# Funktionen
check_avd_exists() {
    "$EMULATOR" -list-avds 2>/dev/null | grep -q "^${AVD_NAME}$"
}

check_system_image() {
    "$SDKMANAGER" --list_installed 2>/dev/null | grep -q "$SYSTEM_IMAGE_PKG"
}

install_system_image() {
    echo -e "${YELLOW}Installing system image...${NC}"
    echo "y" | "$SDKMANAGER" "$SYSTEM_IMAGE_PKG"
}

create_avd() {
    echo -e "${YELLOW}Creating AVD: $AVD_NAME${NC}"

    # AVD erstellen
    echo "no" | "$AVDMANAGER" create avd \
        --name "$AVD_NAME" \
        --package "$SYSTEM_IMAGE_PKG" \
        --device "$DEVICE" \
        --force

    # Config anpassen
    AVD_DIR="$HOME/.android/avd/${AVD_NAME}.avd"
    CONFIG_INI="$AVD_DIR/config.ini"

    if [ -f "$CONFIG_INI" ]; then
        # RAM setzen
        sed -i '' "s/hw.ramSize=.*/hw.ramSize=$RAM/" "$CONFIG_INI" 2>/dev/null || \
        echo "hw.ramSize=$RAM" >> "$CONFIG_INI"

        # GPU aktivieren
        echo "hw.gpu.enabled=yes" >> "$CONFIG_INI"
        echo "hw.gpu.mode=$GPU" >> "$CONFIG_INI"

        # Keyboard aktivieren
        echo "hw.keyboard=yes" >> "$CONFIG_INI"
    fi

    echo -e "${GREEN}AVD erstellt: $AVD_NAME${NC}"
}

start_emulator() {
    echo -e "${GREEN}Starting emulator...${NC}"

    # Prüfen ob schon läuft
    if "$ADB" devices | grep -q "emulator"; then
        echo -e "${YELLOW}Ein Emulator läuft bereits${NC}"
        "$ADB" devices
        return 0
    fi

    # Emulator starten
    "$EMULATOR" -avd "$AVD_NAME" \
        -gpu "$GPU" \
        -no-snapshot-load \
        -no-boot-anim \
        &

    echo -e "${YELLOW}Warte auf Emulator boot...${NC}"
    "$ADB" wait-for-device

    # Warte bis vollständig gebootet
    while [ "$("$ADB" shell getprop sys.boot_completed 2>/dev/null)" != "1" ]; do
        sleep 2
    done

    echo -e "${GREEN}Emulator gestartet!${NC}"
}

cold_boot() {
    echo -e "${GREEN}Cold boot emulator...${NC}"
    "$EMULATOR" -avd "$AVD_NAME" \
        -gpu "$GPU" \
        -no-snapshot-load \
        -wipe-data \
        &
}

list_avds() {
    echo -e "${BLUE}Verfügbare AVDs:${NC}"
    "$EMULATOR" -list-avds
}

stop_emulator() {
    echo -e "${YELLOW}Stopping emulator...${NC}"
    "$ADB" emu kill 2>/dev/null || true
    echo -e "${GREEN}Emulator gestoppt${NC}"
}

show_help() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  start       Start den konfigurierten Emulator (default)"
    echo "  create      Erstellt den AVD falls nicht vorhanden"
    echo "  cold        Cold boot (wipe data)"
    echo "  stop        Stoppt den laufenden Emulator"
    echo "  list        Zeigt alle verfügbaren AVDs"
    echo "  status      Zeigt Emulator Status"
    echo "  help        Diese Hilfe"
    echo ""
    echo "Config: $CONFIG_FILE"
}

status() {
    echo -e "${BLUE}Status:${NC}"
    echo ""

    if check_avd_exists; then
        echo -e "  AVD '$AVD_NAME': ${GREEN}existiert${NC}"
    else
        echo -e "  AVD '$AVD_NAME': ${RED}nicht vorhanden${NC}"
    fi

    if "$ADB" devices | grep -q "emulator"; then
        echo -e "  Emulator: ${GREEN}läuft${NC}"
        "$ADB" devices | grep emulator
    else
        echo -e "  Emulator: ${YELLOW}gestoppt${NC}"
    fi
}

# Main
case "${1:-start}" in
    start)
        if ! check_avd_exists; then
            echo -e "${YELLOW}AVD '$AVD_NAME' existiert nicht${NC}"

            if ! check_system_image; then
                install_system_image
            fi

            create_avd
        fi
        start_emulator
        ;;
    create)
        if ! check_system_image; then
            install_system_image
        fi
        create_avd
        ;;
    cold)
        cold_boot
        ;;
    stop)
        stop_emulator
        ;;
    list)
        list_avds
        ;;
    status)
        status
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        show_help
        exit 1
        ;;
esac
