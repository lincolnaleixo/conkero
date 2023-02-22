import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import date from '../lib/date.js'

let index = 0
let elapsedTime = 0

const maxRuns = process.argv[2] || 1
const fileName = fileURLToPath(import.meta.url)
const filePath = fileName.split('/')
  .slice(
    0,
    -1
  )
  .join('/')

const jobName = fileName.split('/')
  .pop()
  .split('.')
  .shift()

try {
  const module = await import(`../jobs/${jobName}.js`)
  const defaultModule = module.default

  process.env.TEST = true

  console.log(`\nStarting ${maxRuns} runs test...\n`)

  for (index = 0; index < maxRuns; index++) {
    console.log(`Test run ${index + 1} started\n`)
    const runElapsedTime = await defaultModule.run()
    elapsedTime += parseFloat(runElapsedTime)
    console.log(`\nTest run ${index + 1} finished successfully!\n`)
  }

  const msg = `${date.getNowFullDateLAISO()} | SUCCESS | ${jobName} test with maxRuns: ${maxRuns} finished successfully! Elapsed time: ${elapsedTime} seconds\n`
  console.log(msg)
  // append into logs.logs
  await fs.appendFileSync(
    `${filePath}/` + 'tests.log',
    msg
  )
} catch (err) {
  const msg = `${date.getNowFullDateLAISO()} | FAILED | ${jobName} test ${(index + 1)} / ${maxRuns} failed with error: ${err}\n`
  console.log(msg)
  await fs.appendFileSync(
    `${filePath}/` + 'tests.log',
    msg
  )
}

process.exit(0)
