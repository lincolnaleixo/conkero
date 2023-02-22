import https from 'node:https'
import querystring from 'node:querystring'
import config from '../lib/config.js'

function sendTelegramMessage (message) {
  try {
    return new Promise((
      resolve, reject
    ) => {
      console.log('Sending telegram message')

      const baseUrl = `https://api.telegram.org/bot${config.TELEGRAM_TOKEN}`
      const queryParams = {
        chat_id: config.TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      }

      const urlParams = querystring.stringify(queryParams)
      const url = `${baseUrl}/sendMessage?${urlParams}`

      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }

      const req = https.request(
        url,
        options,
        res => {
          let responseData = ''
          res.on(
            'data',
            d => {
              responseData += d
            }
          )
          res.on(
            'end',
            () => {
              console.log('telegram message sent')
              resolve(responseData)
            }
          )
        }
      )

      req.on(
        'error',
        error => {
          console.error(`Error sending Telegram message: ${error}`)
          reject(error)
        }
      )

      req.end()
    })
  } catch (err) {
    console.log(err)
  }
}

export default sendTelegramMessage
