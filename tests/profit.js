import logger from '../lib/logger.js'
import finances from '../src/finances.js'
import orders from '../src/orders.js'
import products from '../src/products.js'
const ordersDB = (await orders.getDB('2023-02-17')).orders
const financesDB = (await finances.getDB('2023-02-17')).data.ShipmentEventList

const ordersAmazon = ordersDB.filter(order => order['sales-channel'] !== 'Non-Amazon')

for (let index = 0; index < ordersAmazon.length; index++) {
  let totalFees = 0
  const order = ordersAmazon[index]
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
