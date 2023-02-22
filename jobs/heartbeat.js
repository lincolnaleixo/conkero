process.env.JOB = 'system'
const module = await import('../lib/logger.js')
const logger = await module.default

await logger.info('Heartbeat')

await new Promise((resolve) => setTimeout(
  resolve,
  2000
)) // Wait for pending I/O operations to complete

process.exit(0)
