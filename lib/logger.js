import {
  createLogger, format, transports
} from 'winston'

import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

import SentryTransport from 'winston-transport-sentry-node'
import configDB from '../lib/config.js'

let logger

const __filename = fileURLToPath(import.meta.url)
const __dirname = __filename.split('/')
  .slice(
    0,
    -1
  )
  .join('/')

const __rootpath = path.resolve(
  __dirname,
  '..'
)
const {
  combine, timestamp, label, printf
} = format

const typeColors = {
  debug: '\x1b[36m',
  info: '\x1b[32m',
  warn: '\x1b[33m',
  error: '\x1b[31m'
}

// If not testing or system calls
if (process.env?.JOB?.indexOf('Test') === -1 || process.env?.JOB === 'system') {
  const Sentry = SentryTransport.default

  const sentryOptions = {
    sentry: { dsn: configDB.SENTRY_DSN },
    level: 'error',
    captureUnhandledRejections: true,
    maxBreadcrumbs: 50,
    tracesSampleRate: 1.0,
    root: __dirname,
    patchGlobal: true
  }

  const consoleFormat = combine(
    timestamp(),
    label({ label: process.env.JOB }),
    printf(({
      level, message, label, timestamp
    }) => {
      return `${typeColors[level]}${timestamp} | ${level.toUpperCase()
              .padEnd(5)} | ${label} | ${message}\x1b[0m`
    })
  )

  const fileFormat = combine(
    timestamp(),
    label({ label: process.env.JOB }),
    printf(({
      level, message, label, timestamp
    }) => {
      return `${timestamp} | ${level.toUpperCase()
              .padEnd(5)} | ${label} | ${message}`
    })
  )

  try {
    logger = createLogger({ transports: [
      new transports.Console({
        level: 'info', format: consoleFormat
      }),
      new transports.File({
        filename: path.join(
          __rootpath,
          'logs',
           `${process.env.JOB}.log`
        ),
        level: 'debug',
        format: fileFormat
      }),
      new transports.File({
        filename: path.join(
          __rootpath,
          'logs',
          'combined.log'
        ),
        level: 'debug',
        format: fileFormat
      }),
      new Sentry(sentryOptions)
    ] })
  } catch (err) {
    console.error(`Error setting up logger: ${err}`)
  }
} else {
  const myFormat = printf(({
    level, message, label, timestamp
  }) => `${typeColors[level]}${timestamp} | ${level.toUpperCase()
    .padEnd(5)} | ${label} | ${message}\x1b[0m`)

  logger = createLogger({
    format: combine(
      timestamp(),
      label({ label: process.env.JOB }),
      myFormat
    ),
    transports: [
      new transports.Console({ level: 'debug' })
    ]

  })
}

export default logger
