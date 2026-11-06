#!/bin/sh
set -eu

case "$1" in
  remove|purge) ;;
  *) exit 0 ;;
esac

app_executable='/opt/taskmatrix-wbt/taskmatrix-wbt'
link='/usr/bin/taskmatrix-wbt'

if command -v update-alternatives >/dev/null 2>&1; then
  if update-alternatives --list taskmatrix-wbt 2>/dev/null | grep -Fxq "$app_executable"; then
    update-alternatives --remove taskmatrix-wbt "$app_executable"
  fi
elif [ -L "$link" ] && [ "$(readlink "$link")" = "$app_executable" ]; then
  rm -f "$link"
fi
