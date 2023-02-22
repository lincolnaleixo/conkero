import sendTelegramMessage from '../lib/alert.js'
import config from '../lib/config.js'

await sendTelegramMessage(
  'test',
  config.TELEGRAM_TOKEN,
  config.TELEGRAM_CHAT_ID
)
