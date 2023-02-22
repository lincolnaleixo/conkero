import config from '../lib/config.js'
import dateHelper from '../lib/date.js'
import db from '../lib/db.js'
import helper from '../lib/helper.js'
import logger from '../lib/logger.js'
import sp from './sp.base.js'
import Reports from './sp.reports.js'

async function request () {
  try {
    logger.info('Requesting data from Amazon API...')
    const params = {
      reportType: 'GET_MERCHANT_LISTINGS_ALL_DATA',
      marketplaceIds: [config.MARKETPLACE_ID]
    }
    const {
      reportData, processedDate
    } = await Reports.createAndProcessReport(params)
    logger.info('Data received from API successfully')
    return {
      reportData, processedDate
    }
  } catch (err) {
    logger.error(err)
    throw err
  }
}

async function saveDB (
  newProducts, processedDate
) {
  logger.info('Saving data to DB...')
  const dataDate = dateHelper.getNowFullDateLAISO()
  logger.debug(`dataDate: ${dataDate}`)

  try {
    for (let index = 0; index < newProducts.length; index++) {
      const newProduct = newProducts[index]

      const existingProduct = await db.collection('products')
        .findOne({ 'seller-sku': newProduct['seller-sku'] })

      if (!existingProduct) {
        logger.info(`Product ${newProduct['seller-sku']} does not exists, inserting...`)
        // newProduct.version = 'new'

        // Insert new product if it doesn't exist
        await db
          .collection('products')
          .insertOne(newProduct)
      } else {
        const newValues = {}
        const oldValues = {}
        for (const key in newProduct) {
          // check if key does not exists in existing product
          if (!(key in existingProduct)) {
            logger.debug(`SKU ${newProduct['seller-sku']}: Found new key: ${key}`)
            newValues[key] = newProduct[key]
            oldValues[key] = ''
          } else {
            existingProduct[key] = existingProduct[key].trim()
            newProduct[key] = newProduct[key].trim()
            newProduct[key] = newProduct[key]
              .replace(
                /&amp;/g,
                '&'
              )
            if (newProduct[key] !== existingProduct[key]) {
              newValues[key] = newProduct[key]
              oldValues[key] = existingProduct[key]
              logger.debug(`SKU ${newProduct['seller-sku']}: Found new value for existent key: ${key}`)
            }
          }
        }

        if (Object.keys(newValues).length > 0) {
          // Only update the product if there are any changes
          // newValues.version = date.getNowFullDateLAISO()
          await db.collection('products')
            .updateOne(
              { 'seller-sku': newProduct['seller-sku'] },
              { $set: newValues }
            )
          logger.debug(`Product ${newProduct['seller-sku']} updated successfully`)
          logger.debug(`Old values: ${JSON.stringify(oldValues)}`)
          logger.debug(`New values: ${JSON.stringify(newValues)}`)

          // Save the changes to the productHistory collection
          const change = {
            'seller-sku': newProduct['seller-sku'],
            date: dataDate,
            newValues,
            oldValues
          }
          await db.collection('productsHistories')
            .insertOne(change)
        }
      }
    }

    logger.info('Data updated successfully')
  } catch (error) {
    logger.error(error)
    throw error
  }
}

async function getDB () {
  const products = await db
    .collection('products')
    .find()
    .toArray()
  return products
}

async function getCogsDB (sku) {
  const cogs = await db
    .collection('productsCogs')
    .findOne({
      sellerSKU: sku,
      endDate: '2099-12-31T23:59:59'
    })
  return cogs
}

async function addCogs (
  sellerSKU, cogs
) {
  console.log('Adding cogs...')
  const startDate = dateHelper.getNowFullDateLAISO()
  const endDate = '2099-12-31T23:59:59'

  const previousCogs = await db
    .collection('productsCogs')
    .findOne({
      sellerSKU,
      endDate
    })

  if (!previousCogs) {
    console.log('Cogs does not exists, creating...')
    await db
      .collection('productsCogs')
      .insertOne({
        sellerSKU,
        startDate,
        endDate,
        cogs
      })
  } else {
    console.log('Cogs already exists, updating...')
    await updateCogs(
      sellerSKU,
      startDate
    )
    await db
      .collection('productsCogs')
      .insertOne({
        sellerSKU,
        startDate,
        endDate,
        cogs
      })
  }

  console.log('Finished adding/updating cogs...')
}

async function updateCogs (sellerSKU) {
  await db
    .collection('productsCogs')
    .updateOne(
      {
        sellerSKU,
        endDate: '2099-12-31T23:59:59'
      },
      { $set: { endDate: dateHelper.getLADateWithDiffSeconds(1) } }
    )
}

async function getMyFeesEstimateForSKU (
  sellerSKU, price
) {
  try {
    logger.info(`Requesting fee estimate for SKU ${sellerSKU}...`)
    const response = await sp.callAPI({
      operation: 'getMyFeesEstimateForSKU',
      endpoint: 'productFees',
      path: { SellerSKU: sellerSKU },
      body: { FeesEstimateRequest: {
        MarketplaceId: config.MARKETPLACE_ID,
        IsAmazonFulfilled: true,
        PriceToEstimateFees: { ListingPrice: {
          CurrencyCode: 'USD',
          Amount: price
        } },
        Identifier: 'UmaS1'
      } }
    })
    return response
  } catch (err) {
    logger.error(err)
    throw err
  }
}

async function requestApiAndSaveDb () {
  try {
    const {
      reportData, processedDate
    } = await request()

    await saveDB(
      reportData,
      processedDate
    )
  } catch (err) {
    if (err.message.includes('ENETDOWN')) {
      logger.error(err.message)
      logger.error('Network error, retrying in 30 seconds...')
      await helper.sleep(30)
      return await requestApiAndSaveDb()
    } else {
      logger.error(err)
      throw err
    }
  }
}
export default {
  requestApiAndSaveDb,
  addCogs,
  getDB,
  getMyFeesEstimateForSKU,
  getCogsDB
}
