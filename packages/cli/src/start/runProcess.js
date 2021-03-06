import {spawn} from 'child_process'
import colors from 'colors/safe'
import writeFile from '../helpers/writeFile'
import {setOnExit} from '../helpers/onExit'
import waitAppStopped from './waitAppStopped'

let isExited = false

export default async function ({restart, options}) {
  const MONGO_URL = process.env.MONGO_URL || global.localMongoURI
  let startCommand = process.env.START_COMMAND || 'node'

  const args = []

  if (process.env.START_COMMAND) {
    const [first, ...otherArgs] = process.env.START_COMMAND.split(' ')
    startCommand = first
    args.push(...otherArgs)
  } else if (options.shell) {
    args.push('--inspect')
  }

  args.push('.orion/build/index.js')

  if (process.env.START_COMMAND) {
    console.log('Using custom command: ' + [startCommand, ...args].join(' '))
  }

  const appProcess = spawn(startCommand, args, {
    env: {
      MONGO_URL,
      ORION_DEV: 'local',
      ...process.env
    },
    cwd: process.cwd(),
    stdio: 'inherit',
    detached: true
  })

  await writeFile('.orion/process', appProcess.pid)

  appProcess.on('exit', function (code, signal) {
    if (!code || code === 143 || code === 0 || signal === 'SIGTERM' || signal === 'SIGINT') {
    } else {
      console.log(colors.bold('Exit code: ' + code))
      console.log(colors.bold('\n=> Error running app, restarting...'))
      appProcess.kill()
      setTimeout(() => {
        if (!isExited) {
          restart()
        }
      }, 2000)
    }
  })

  setOnExit(async () => {
    isExited = true
    if (appProcess) {
      appProcess.kill()
      await waitAppStopped()
    }
  })

  return appProcess
}
