
#!/bin/sh
set -eu

APP_DIR="/opt/taskmatrix-wbt"
EXECUTABLE="taskmatrix-wbt"
HELPER="$APP_DIR/chrome-sandbox"

LINK="/usr/bin/$EXECUTABLE"
ALTERNATIVES_LINK="/etc/alternatives/$EXECUTABLE"
LEGACY_TARGET="/opt/TaskMatrix - WBT/taskmatrix-wbt"

# Verify application executable
if [ ! -x "$APP_DIR/$EXECUTABLE" ]; then
    echo "TaskMatrix WBT executable is missing: $APP_DIR/$EXECUTABLE" >&2
    exit 1
fi

# Verify Chromium sandbox helper
if [ ! -f "$HELPER" ]; then
    echo "Chromium sandbox helper is missing: $HELPER" >&2
    exit 1
fi

# Configure Chromium sandbox permissions
chown root:root "$HELPER"

# Prefer Chromium user namespace sandbox when available.
# Fall back to the SUID sandbox helper otherwise.
if [ -L /proc/self/ns/user ] &&
    command -v unshare >/dev/null 2>&1 &&
    unshare --user true >/dev/null 2>&1; then
    chmod 0755 "$HELPER"
else
    chmod 4755 "$HELPER"
fi
# Configure application command
if command -v update-alternatives >/dev/null 2>&1; then

    # Remove the previous installation target if registered
    if update-alternatives --list "$EXECUTABLE" 2>/dev/null |
        grep -Fxq "$LEGACY_TARGET"; then
        update-alternatives --remove "$EXECUTABLE" "$LEGACY_TARGET"
    fi

    # Preserve an existing alternatives-managed symlink
    if [ -L "$LINK" ]; then
        CURRENT_LINK="$(readlink "$LINK" || true)"

        if [ "$CURRENT_LINK" != "$ALTERNATIVES_LINK" ]; then
            rm -f "$LINK"
        fi
    elif [ -e "$LINK" ]; then
        echo "Refusing to overwrite existing non-symlink: $LINK" >&2
        exit 1
    fi

    update-alternatives --install \
        "$LINK" \
        "$EXECUTABLE" \
        "$APP_DIR/$EXECUTABLE" \
        100
else
    if [ -e "$LINK" ] && [ ! -L "$LINK" ]; then
        echo "Refusing to overwrite existing executable: $LINK" >&2
        exit 1
    fi

    ln -sfn "$APP_DIR/$EXECUTABLE" "$LINK"
fi

# Refresh desktop application database
if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database -q /usr/share/applications || true
fi

exit 0
