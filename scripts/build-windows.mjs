import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distDirectory = join(projectRoot, 'dist')

if (process.platform !== 'win32') {
  throw new Error('Windows installers must be built on a Windows host.')
}

function run(executable, args, options = {}) {
  const result = spawnSync(executable, args, {
    cwd: projectRoot,
    stdio: 'inherit',
    ...options
  })

  if (result.error) throw result.error
  if (result.status !== 0) {
    throw new Error(`${executable} exited with status ${result.status ?? 'unknown'}.`)
  }
}

function cleanPreviousWindowsArtifacts() {
  if (!existsSync(distDirectory)) return

  for (const entry of readdirSync(distDirectory, { withFileTypes: true })) {
    const isWindowsArtifact =
      /^TaskMatrix-WBT-.*-Setup\.(?:exe|blockmap)$/i.test(entry.name) ||
      entry.name === 'latest.yml' ||
      entry.name === 'win-unpacked'

    if (isWindowsArtifact) {
      rmSync(join(distDirectory, entry.name), { recursive: true, force: true })
    }
  }
}

const npmCli = process.env.npm_execpath
if (npmCli) {
  run(process.execPath, [npmCli, 'run', 'build'])
} else {
  run('npm', ['run', 'build'])
}

cleanPreviousWindowsArtifacts()

const electronBuilderCli = join(projectRoot, 'node_modules/electron-builder/cli.js')
const builderArgs = [electronBuilderCli, '--win', '--publish', 'never']
if (process.env.WINDOWS_CERT_PUBLISHER_NAME) {
  builderArgs.push(`--config.win.publisherName=${process.env.WINDOWS_CERT_PUBLISHER_NAME}`)
}
run(process.execPath, builderArgs)

const version = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8')).version
const installerName = `TaskMatrix-WBT-${version}-Setup.exe`
if (!existsSync(join(distDirectory, installerName))) {
  throw new Error(`Windows installer was not generated: ${installerName}`)
}
if (!existsSync(join(distDirectory, 'latest.yml'))) {
  throw new Error('Windows update metadata was not generated: dist/latest.yml')
}

console.log(`Validated Windows installer and update metadata for version ${version}.`)
