import SellingPartnerAPI from 'amazon-sp-api'
import config from '../lib/config.js'

const sellingPartner = new SellingPartnerAPI({
  region: config.SP_REGION,
  refresh_token: config.SP_REFRESH_TOKEN,
  options: {
    auto_request_tokens: true,
    auto_request_throttled: true,
    version_fallback: true,
    use_sandbox: false,
    only_grantless_operations: false,
    debug_log: false
  },
  credentials: {
    SELLING_PARTNER_APP_CLIENT_ID: config.SP_APP_CLIENT_ID,
    SELLING_PARTNER_APP_CLIENT_SECRET: config.SP_APP_CLIENT_SECRET,
    AWS_ACCESS_KEY_ID: config.SP_AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: config.SP_AWS_SECRET_KEY,
    AWS_SELLING_PARTNER_ROLE: config.SP_ROLE_ARN
  }
})

export default sellingPartner
