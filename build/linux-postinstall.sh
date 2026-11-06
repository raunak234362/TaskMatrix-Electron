#!/bin/sh
set -eu

app_dir='/opt/taskmatrix-wbt'
executable='${executable}'
helper="$app_dir/chrome-sandbox"

if [ ! -x "$app_dir/$executable" ]; then
  echo "TaskMatrix WBT executable is missing from $app_dir" >&2
  exit 1
fi

if [ ! -f "$helper" ]; then
  echo "Chromium sandbox helper is missing from $app_dir" >&2
  exit 1
fi

link="/usr/bin/$executable"
if command -v update-alternatives >/dev/null 2>&1; then
  if [ -L "$link" ] && [ -e "$link" ] && [ "$(readlink "$link")" != "/etc/alternatives/$executable" ]; then
    rm -f "$link"
  fi
  legacy_target='/opt/TaskMatrix - WBT/taskmatrix-wbt'
  if update-alternatives --list "$executable" 2>/dev/null | grep -Fxq "$legacy_target"; then
    update-alternatives --remove "$executable" "$legacy_target"
  fi
  update-alternatives --install "$link" "$executable" "$app_dir/$executable" 100
else
  ln -sfn "$app_dir/$executable" "$link"
fi

chown root:root "$helper"
if [ -L /proc/self/ns/user ] && command -v unshare >/dev/null 2>&1 && unshare --user true >/dev/null 2>&1; then
  chmod 0755 "$helper"
else
  chmod 4755 "$helper"
fi

if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database /usr/share/applications
fi
