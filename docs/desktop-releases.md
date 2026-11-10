# TaskMatrix WBT desktop builds and releases

## Architecture and audit notes

- The application uses Electron 38.x, electron-vite 4, React 19, and electron-builder 25. The main process is `src/main/index.js`; the restricted preload bridge is `src/preload/index.js`; Vite emits `out/main`, `out/preload`, and `out/renderer`.
- The preload exposes specific notification, PDF, system-event, version, and update functions. It does not expose Electron's general-purpose `ipcRenderer` to the renderer.
- The project has no application-owned `exec`, `spawn`, `fork`, or shell-command process launcher. Chromium starts its own subprocesses internally. Native build-time dependencies such as Lightning CSS and Tailwind Oxide are transitive; there are no direct application native Node add-ons.
- The updater is `electron-updater` using the existing GitHub Releases provider configured for `raunak234362/TaskMatrix-Electron`. The package metadata currently says version `1.0.0`; tags must match the package version.
- The previous Linux package metadata showed two distinct installed packages, `taskmatrix` and `taskmatrix-wbt`, using different `/opt` directories, executable names, desktop entries, and icons. The WBT package name is explicitly retained as `taskmatrix-wbt`; no alternatives are shared with the separate `taskmatrix` package.

## Linux failure causes and limits

The previous Debian package contained `chrome-sandbox` as a regular executable. Its generated `postinst` attempted to enable the setuid helper only when unprivileged user namespaces were unavailable, but suppressed permission errors with `|| true` and did not verify root ownership. An installation could therefore complete even if Chromium had no usable sandbox. The new Debian `postinst` checks for the helper and executable, makes the helper root-owned, and fails installation if the selected supported sandbox setup cannot be applied.

The old package used `/opt/TaskMatrix - WBT`. Its generated desktop entry quoted the executable path correctly, and the application itself did not build shell commands or spawn subprocesses. Thus the message `execvp: /opt/TaskMatrix` alone does not establish that spaces were the root cause. Linux builds now use `/opt/taskmatrix-wbt`, avoiding that ambiguity; the release validator checks the generated launcher and executable paths.

AppImage images are mounted read-only and commonly with `nosuid`; an AppImage cannot install a root-owned setuid sandbox helper. It uses Chromium's unprivileged user-namespace sandbox instead. AppImages are supported only on hosts that permit unprivileged user namespaces for the app. If a host security policy blocks those namespaces, use the Debian package, whose installer can configure the supported helper. Do not start the app with `--no-sandbox`.

An AppImage also needs its executable bit preserved by the download method and filesystem. This is an AppImage format requirement, separate from the Chromium sandbox helper. If a browser or filesystem strips execute permission, use the desktop file manager's application-launch permission control or download/install the `.deb`.

## Linux build prerequisites and commands

Build Linux packages on Linux, not on Windows or macOS. Install Node.js 20, npm, and the native tools required by electron-builder (including `dpkg-deb` for Debian packaging). The build uses Electron 38.5.0 from the lockfile and electron-builder 25.1.8.

```bash
npm ci
npm run build:linux:deb
npm run build:linux:appimage
npm run build:linux
```

`build:linux` compiles the main process, preload, and renderer; removes only prior TaskMatrix Linux artifacts from `dist`; builds the Debian and AppImage targets; and runs `scripts/validate-linux-release.mjs`. It keeps unrelated Windows/macOS artifacts in `dist`. The Linux package's internal product filename is set to `taskmatrix-wbt` for that build, while the desktop display name remains `TaskMatrix WBT`.

The release validator checks Debian metadata and payloads, the Debian maintainer script, AppImage extraction, launchers, icons, app resources, executable permissions, and the expected package/application identity. It does not install a system package or launch a GUI application.

## Linux package configuration

`electron-builder.yml` defines:

- Linux app ID `com.whiteboard.taskmatrix`, executable and Debian package name `taskmatrix-wbt`.
- `.deb` and `.AppImage` targets, app icon, desktop display metadata, and the `Utility` category.
- A Debian post-install hook at `build/linux-postinstall.sh`. It configures the bundled `chrome-sandbox` only, selects user namespaces when available, and uses a root-owned `4755` helper only when the host needs that fallback.
- Linux AppImage auto-updating. electron-builder 25 / electron-updater 6.6.2 also marks `.deb` updating as a beta feature and emits package-type metadata. This app deliberately does not enable that updater: its Debian installer path uses system-level elevation and is not exercised on supported Ubuntu releases here. Debian package updates are handled through the package manager.

Install or upgrade a Debian package through the graphical package installer or:

```bash
sudo apt install ./taskmatrix-wbt_<version>_amd64.deb
```

Uninstall through the package manager or `sudo apt remove taskmatrix-wbt`. Removing the package does not remove the user's Electron profile in their home directory. Do not remove the separate `taskmatrix` package unless its owner intends to do so.

## Windows installer and signing

Windows packages are built on Windows using the NSIS target:

```powershell
npm ci
npm run build:windows
```

The installer is per-user by default, creates Start Menu and desktop shortcuts, supports in-place upgrades using the existing Windows application ID, and retains per-user data on uninstall. It does not require administrator privileges by default.

electron-builder consumes `CSC_LINK` and `CSC_KEY_PASSWORD` for Authenticode signing. Configure GitHub Actions secrets `WINDOWS_CSC_LINK`, `WINDOWS_CSC_KEY_PASSWORD`, and `WINDOWS_CERT_PUBLISHER_NAME`; never store certificates or passwords in the repository. `CSC_LINK` should be an electron-builder-supported certificate path or URI. The build script adds the expected publisher to update metadata only when `WINDOWS_CERT_PUBLISHER_NAME` is configured, so update signature verification can match the signing certificate.

Unsigned installers can be produced if signing credentials are absent, but Windows SmartScreen may show a warning and users cannot verify the publisher. Configure a trusted code-signing certificate before treating the release as production-signed.

## Updates and release publishing

Windows NSIS installers, macOS releases, and Linux AppImages use `electron-updater` and the existing GitHub Releases provider. Updates are checked at application startup and every six hours by default. Users can also check manually, enable/disable periodic checks, and opt into background downloads in the in-app Updates panel. Downloads show progress; installation requires an explicit **Restart and install** action. Dismissing an available version is remembered in the user's renderer profile.

The updater is controlled by validated IPC methods in the preload bridge; the renderer never receives the updater instance. Update checks and failures are logged through `electron-log`. Network and metadata failures do not block normal application use.

Debian packages do not self-update in-app. Their Updates panel explains that updates are managed by the package manager. The `.deb` updater feature is beta in the pinned updater release and invokes privileged system package operations, so it remains disabled pending clean-install and upgrade testing. AppImage support requires a host where the Chromium user-namespace sandbox works. No update process removes user data.

To publish a release:

1. Update `version` in `package.json` and the matching root version in `package-lock.json` (for example, `npm version patch --no-git-tag-version`).
2. Commit the version change and push a semantic version tag matching it, e.g. `v1.3.5`.
3. GitHub Actions builds Windows on Windows, Linux on Ubuntu, and macOS on macOS, validates artifacts and metadata, and creates a GitHub Release only after all builds pass.
4. The release includes Windows `latest.yml`, Linux `latest-linux.yml`, installers, AppImage, and SHA-256 checksum lists. The update provider must keep the metadata and corresponding artifacts together on the same release.

The CI workflow needs the existing `PROD_BASE_URL` environment secrets for renderer configuration and `GITHUB_TOKEN` for GitHub release publishing. The repository must allow GitHub Actions to create releases. Windows signing secrets are optional for unsigned builds; they are required for signed production installers.

## Release validation checklist

- [ ] `package.json` and `package-lock.json` have the intended semantic version.
- [ ] Push a matching `v<version>` tag.
- [ ] Windows build produces the NSIS installer and `latest.yml`.
- [ ] Linux build produces `.deb`, `.AppImage`, and `latest-linux.yml`; validation passes.
- [ ] Release artifacts and metadata are attached to the GitHub release.
- [ ] Verify checksums and, when signing is configured, verify the Windows Authenticode publisher.
- [ ] Test installation and upgrade on clean supported OS images before broad release.
- [ ] Test AppImage launch under the target host's user-namespace/AppArmor policy; a successful extraction is not proof of sandboxed GUI launch.
- [ ] Keep an earlier release available for rollback and do not overwrite update metadata independently of its artifacts.

## Testing and support boundaries

`npm run build:linux` performs package construction and static payload validation. It does not install packages, change system ownership, run a clean Ubuntu VM, exercise the login/backend, or prove that AppImage user namespaces are permitted on a specific machine. Those require target Ubuntu test environments and signing/release credentials. The current CI builds packages and checks their release metadata but does not execute the desktop GUI.
