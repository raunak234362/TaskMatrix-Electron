import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distDirectory = join(projectRoot, 'dist')
const requestedTarget = process.argv[2]
const targets = {
  all: ['AppImage', 'deb'],
  AppImage: ['AppImage'],
  deb: ['deb']
}

if (process.platform !== 'linux') {
  throw new Error('Linux packages must be built on a Linux host.')
}

if (!targets[requestedTarget]) {
  throw new Error(`Unknown Linux build target "${requestedTarget}". Use all, deb, or AppImage.`)
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

  return result
}

function cleanPreviousLinuxArtifacts() {
  if (!existsSync(distDirectory)) return

  for (const entry of readdirSync(distDirectory, { withFileTypes: true })) {
    const isLinuxArtifact =
      /^taskmatrix-wbt(?:[-_].*)?\.(?:AppImage|deb|rpm|snap|blockmap)$/i.test(entry.name) ||
      entry.name === 'latest-linux.yml' ||
      entry.name === 'linux-unpacked'

    if (isLinuxArtifact) {
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

cleanPreviousLinuxArtifacts()

const electronBuilderCli = join(projectRoot, 'node_modules/electron-builder/cli.js')
run(process.execPath, [
  electronBuilderCli,
  '--linux',
  ...targets[requestedTarget],
  '--config.productName=taskmatrix-wbt',
  '--publish',
  'never'
])
run(process.execPath, [join(projectRoot, 'scripts/validate-linux-release.mjs'), requestedTarget])
