import config from '../lib/config.js'
import date from '../lib/date.js'
import db from '../lib/db.js'
import helper from '../lib/helper.js'
import logger from '../lib/logger.js'
import finances from '../src/finances.js'
import orders from '../src/orders.js'
import products from '../src/products.js'
import spReports from './sp.reports.js'

async function requestApiAndSaveDb (
  startDate, endDate
) {
  try {
    const dataStartTime = date.transformDateToISO(
      startDate,
      'full',
      true,
      true
    )

    const dataEndTime = date.transformDateToISO(
      endDate,
      'full',
      true,
      true
    )

    const params = {
      reportType: 'GET_FLAT_FILE_ALL_ORDERS_DATA_BY_ORDER_DATE_GENERAL',
      dataStartTime,
      dataEndTime,
      marketplaceIds: [config.MARKETPLACE_ID]
    }

    const result = await request(params)
    const shortDate = date.transformDateToISO(
      startDate,
      'short'
    )

    await saveDB(
      result.reportData,
      shortDate,
      result.processedDate
    )
  } catch (err) {
    if (err.message.includes('ENETDOWN')) {
      logger.error(err.message)
      logger.error('Network error, retrying in 30 seconds...')
      await helper.sleep(30)
      return await requestApiAndSaveDb(
        startDate,
        endDate
      )
    } else {
      logger.error(err)
      throw err
    }
  }
}

async function request (params) {
  try {
    logger.info('Requesting data from Amazon API...')

    const result = await spReports
      .createAndProcessReport(params)

    logger.info('Data received from API')
    return result
  } catch (err) {
    logger.error(err)
    throw err
  }
}

async function saveDB (
  orders, date, processedDate
) {
  logger.info('Updating data to DB...')

  const dataToSave = {
    date, processedDate, orders
  }

  try {
    const existingOrders = await db.collection('orders')
      .findOne({ date })
    if (!existingOrders) {
      await db.collection('orders')
        .insertOne(dataToSave)
    } else {
      await db.collection('orders')
        .updateOne(
          { date },
          { $set: dataToSave }
        )
    }

    logger.info('Updated on DB successfully')
  } catch (error) {
    logger.error(error)
    throw error
  }
}

async function getDB (shortDate) {
  try {
    const result = await db
      .collection('orders')
      .findOne({ date: shortDate })
    return result
  } catch (error) {
    logger.error(error)
    throw error
  }
}

async function calculateOrderProfit (
  order, financesDB
) {
  let totalFees = 0
  const sku = order.sku
  logger.debug(sku)
  const orderID = order['amazon-order-id']
  logger.debug(orderID)
  const price = order['item-price']
  logger.debug(price)
  if (order['order-status'] !== 'Cancelled') {
    logger.debug(JSON.stringify(
      order,
      null,
      2
    ))

    const orderFinances = financesDB.filter(finances => finances.AmazonOrderId === orderID)
    if (orderFinances.length === 0) {
      console.log(`Order ${orderID} not found in finances`)
      const feesEstimate = await products.getMyFeesEstimateForSKU(
        sku,
        price
      )
      totalFees = feesEstimate.FeesEstimateResult.FeesEstimate.TotalFeesEstimate.Amount
      // console.log(`SKU: ${sku}`)
      // console.log(`Total fees: ${totalFees}`)
      // console.log('cogs: ')
    } else {
      logger.info(`Order ${orderID} found in finances`)
      const ShipmentItemList = orderFinances[0].ShipmentItemList[0]
      // const sellerSKU = ShipmentItemList.SellerSKU

      totalFees = ShipmentItemList.ItemFeeList.reduce(
        (
          acc, curr
        ) => {
          return acc + parseFloat(curr.FeeAmount.CurrencyAmount)
        }
        , 0
      )
      totalFees *= -1
      // TODO criar metodo para get cogs
      // const cogs = await products
      // console.log(`SKU: ${sellerSKU}`)
      // console.log(`Total fees: ${totalFees}`)
    }

    const cogs = await products.getCogsDB(sku)
    const profit = price - cogs.cogs - totalFees
    logger.info(`Sale Price: ${price}\nCogs: ${cogs.cogs}\nFees: ${totalFees}\nProfit: ${profit}`)
  } else {
    logger.info(`Order ${orderID} cancelled`)
  }
}

async function calculateDayOrderProfit (
  day, salesChannel = 'Amazon.com'
) {
  const ordersDB = (await orders.getDB(day)).orders
  const financesDB = (await finances.getDB(day)).data.ShipmentEventList

  const ordersAmazon = ordersDB.filter(order => order['sales-channel'] !== 'Non-Amazon')

  for (let index = 0; index < ordersAmazon.length; index++) {
    const order = ordersAmazon[index]
    await calculateOrderProfit(
      order,
      financesDB
    )
  }
}

export default {
  requestApiAndSaveDb,
  getDB,
  calculateDayOrderProfit
}
