import performance from 'node:perf_hooks'
import { fileURLToPath } from 'node:url'
import sendTelegramMessage from '../lib/alert.js'
import helper from './helper.js'

let fileName

async function run (days = 0) {
  try {
    const start = performance.performance.now()

    fileName = fileURLToPath(import.meta.url)

    if (fileName.includes('/')) {
      fileName = fileName.split('/')
        .pop()
        .replace(
          '.js',
          ''
        )
    }

    console.log(`Job ${fileName} started\n`)

    process.env.JOB = fileName

    if (process.env.TEST) {
      process.env.JOB = `${fileName.split('/')
         .pop()
         .split('.')
         .shift()
          }Test`
    }

    const srcFile = process.env.JOB
      .replace(
        /([A-Z])/g,
        ' $1'
      )
      .split(' ')[0]
    const module = await import(`../src/${srcFile}.js`)
    const defaultModule = module.default
    await runLogic(
      defaultModule,
      days
    )

    const end = performance.performance.now()
    const elapsedTime = ((end - start) / 1000).toFixed(2)
    const message = `Job ${fileName} finished in ${elapsedTime} seconds`

    console.log(`\n${message}`)

    await helper.addNewJobExecution(
      fileName,
      'success',
      elapsedTime,
      message
    )

    console.log(`\nJob ${process.env.JOB} information saved to database\n`)

    await sendTelegramMessage(message)

    return elapsedTime
  } catch (err) {
    const message = `Error in job ${process.env.JOB}\nerror: ${err}`
    console.log(message)
    await helper.addNewJobExecution(
      fileName,
      'failed',
      0,
      err
    )
    await sendTelegramMessage(message)
  }
}

async function runLogic (defaultModule) {
  await defaultModule.requestApiAndSaveDb()
}

// If it's called directly, run it
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await run()
  process.exit(0)
}

export default { run }
