import { spawnSync } from 'node:child_process'
import { accessSync, constants, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distDirectory = join(projectRoot, 'dist')
const requestedTarget = process.argv[2] ?? 'all'
const allowedTargets = new Set(['all', 'AppImage', 'deb'])

if (!allowedTargets.has(requestedTarget)) {
  throw new Error(`Unknown validation target "${requestedTarget}". Use all, deb, or AppImage.`)
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function run(executable, args, options = {}) {
  const result = spawnSync(executable, args, {
    encoding: 'utf8',
    ...options
  })

  if (result.error) throw result.error
  if (result.status !== 0) {
    throw new Error(
      `${executable} exited with status ${result.status ?? 'unknown'}:\n${result.stderr || result.stdout}`
    )
  }

  return result.stdout
}

function readDesktopEntry(filePath, extractionRoot) {
  assert(existsSync(filePath), `Desktop entry not found: ${filePath}`)
  const desktopValidation = spawnSync('desktop-file-validate', [filePath], { encoding: 'utf8' })
  if (desktopValidation.error && desktopValidation.error.code !== 'ENOENT') {
    throw desktopValidation.error
  }
  if (desktopValidation.status !== null && desktopValidation.status !== 0) {
    throw new Error(`Invalid desktop entry ${filePath}:\n${desktopValidation.stderr}`)
  }

  const desktop = readFileSync(filePath, 'utf8')
  assert(/^\[Desktop Entry\]$/m.test(desktop), `Invalid desktop entry: ${filePath}`)
  assert(/^Name=TaskMatrix WBT$/m.test(desktop), `Unexpected display name in ${filePath}`)
  assert(/^Icon=taskmatrix-wbt$/m.test(desktop), `Desktop icon name is incorrect in ${filePath}`)
  assert(/^StartupWMClass=taskmatrix-wbt$/m.test(desktop), `Linux app identity is incorrect in ${filePath}`)

  const execLine = desktop.match(/^Exec=(.+)$/m)?.[1]?.trim()
  assert(execLine, `Desktop executable is missing in ${filePath}`)
  const executable = execLine.match(/^"([^"]+)"|^(\S+)/)?.slice(1).find(Boolean)
  assert(executable, `Could not parse desktop executable in ${filePath}`)

  const executablePath = executable.startsWith('/')
    ? join(extractionRoot, executable.slice(1))
    : join(extractionRoot, executable)
  assert(existsSync(executablePath), `Desktop executable does not exist: ${executable}`)
  accessSync(executablePath, constants.X_OK)

  return desktop
}

function validateDeb(debPath) {
  const metadata = run('dpkg-deb', ['-f', debPath])
  assert(/^Package: taskmatrix-wbt$/m.test(metadata), 'Debian package name must be taskmatrix-wbt.')
  assert(/^Version: \S+$/m.test(metadata), 'Debian package version is missing.')
  assert(/^Architecture: (amd64|arm64)$/m.test(metadata), 'Unexpected Debian package architecture.')

  const tempDirectory = mkdtempSync(join(tmpdir(), 'taskmatrix-wbt-deb-'))
  try {
    const payloadDirectory = join(tempDirectory, 'payload')
    const controlDirectory = join(tempDirectory, 'control')
    run('dpkg-deb', ['--extract', debPath, payloadDirectory])
    run('dpkg-deb', ['--control', debPath, controlDirectory])

    const appDirectory = join(payloadDirectory, 'opt', 'taskmatrix-wbt')
    const executablePath = join(appDirectory, 'taskmatrix-wbt')
    assert(existsSync(executablePath), 'Debian package executable is missing.')
    accessSync(executablePath, constants.X_OK)
    assert(existsSync(join(appDirectory, 'resources', 'app.asar')), 'Debian app resources are missing.')
    assert(existsSync(join(appDirectory, 'chrome-sandbox')), 'Debian Chromium sandbox helper is missing.')
    assert(
      existsSync(join(payloadDirectory, 'usr', 'share', 'icons', 'hicolor', '512x512', 'apps', 'taskmatrix-wbt.png')),
      'Debian application icon is missing.'
    )

    const postInstallPath = join(controlDirectory, 'postinst')
    const postRemovePath = join(controlDirectory, 'postrm')
    assert(existsSync(postInstallPath), 'Debian postinst sandbox configuration is missing.')
    assert(existsSync(postRemovePath), 'Debian postrm cleanup script is missing.')
    const postInstall = readFileSync(postInstallPath, 'utf8')
    const postRemove = readFileSync(postRemovePath, 'utf8')
    assert(/chown root:root/.test(postInstall), 'Debian postinst does not set sandbox helper ownership.')
    assert(/chmod 4755/.test(postInstall), 'Debian postinst does not set the fallback sandbox permissions.')
    assert(/unshare --user true/.test(postInstall), 'Debian postinst does not test user namespace availability.')
    assert(!/chmod 4755[^\n]*\|\|\s*true/.test(postInstall), 'Debian postinst hides sandbox permission failures.')
    assert(/remove\|purge/.test(postRemove), 'Debian postrm does not distinguish removal from upgrade.')
    assert(
      /update-alternatives --remove taskmatrix-wbt "\$app_executable"/.test(postRemove),
      'Debian postrm does not clean up the application alternative.'
    )

    const desktopPath = join(payloadDirectory, 'usr', 'share', 'applications', 'taskmatrix-wbt.desktop')
    const desktop = readDesktopEntry(desktopPath, payloadDirectory)
    assert(
      desktop.includes('Exec=/opt/taskmatrix-wbt/taskmatrix-wbt %U'),
      'Debian desktop entry does not use the installed executable path.'
    )

    console.log(`Validated Debian package: ${debPath}`)
  } finally {
    rmSync(tempDirectory, { recursive: true, force: true })
  }
}

function findFile(root, filename) {
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name)
    if (entry.isFile() && entry.name === filename) return path
    if (entry.isDirectory()) {
      const match = findFile(path, filename)
      if (match) return match
    }
  }
  return undefined
}

function validateAppImage(appImagePath) {
  accessSync(appImagePath, constants.X_OK)
  const tempDirectory = mkdtempSync(join(tmpdir(), 'taskmatrix-wbt-appimage-'))
  try {
    run(appImagePath, ['--appimage-extract'], { cwd: tempDirectory })
    const appDirectory = join(tempDirectory, 'squashfs-root')
    const executablePath = join(appDirectory, 'AppRun')
    assert(existsSync(executablePath), 'AppImage AppRun launcher is missing.')
    accessSync(executablePath, constants.X_OK)
    assert(existsSync(join(appDirectory, 'resources', 'app.asar')), 'AppImage application resources are missing.')
    assert(existsSync(join(appDirectory, 'chrome-sandbox')), 'AppImage Chromium sandbox helper is missing.')
    assert(
      findFile(appDirectory, 'taskmatrix-wbt.png'),
      'AppImage application icon is missing.'
    )

    const desktopPath = findFile(appDirectory, 'taskmatrix-wbt.desktop')
    assert(desktopPath, 'AppImage desktop entry is missing.')
    readDesktopEntry(desktopPath, appDirectory)
    console.log(`Validated AppImage payload: ${appImagePath}`)
  } finally {
    rmSync(tempDirectory, { recursive: true, force: true })
  }
}

const builderConfig = readFileSync(join(projectRoot, 'electron-builder.yml'), 'utf8')
const mainProcess = readFileSync(join(projectRoot, 'src/main/index.js'), 'utf8')
assert(/^  appId: com\.whiteboard\.taskmatrix$/m.test(builderConfig), 'Linux application ID is incorrect.')
assert(/^  executableName: taskmatrix-wbt$/m.test(builderConfig), 'Linux executable name is incorrect.')
assert(/^  packageName: taskmatrix-wbt$/m.test(builderConfig), 'Debian package name is incorrect.')
assert(/sandbox: true/.test(mainProcess), 'The Electron renderer sandbox must be enabled.')
assert(!/--no-sandbox/.test(`${builderConfig}\n${mainProcess}`), 'A no-sandbox launch flag is configured.')

const artifacts = readdirSync(distDirectory)
const debArtifacts = artifacts.filter((name) => name.endsWith('.deb'))
const appImageArtifacts = artifacts.filter((name) => name.endsWith('.AppImage'))
if (requestedTarget === 'all' || requestedTarget === 'deb') {
  assert(debArtifacts.length > 0, 'No Debian package was generated.')
  for (const artifact of debArtifacts) validateDeb(join(distDirectory, artifact))
}
if (requestedTarget === 'all' || requestedTarget === 'AppImage') {
  assert(appImageArtifacts.length > 0, 'No AppImage artifact was generated.')
  for (const artifact of appImageArtifacts) validateAppImage(join(distDirectory, artifact))
}
