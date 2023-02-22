import { fileURLToPath } from 'node:url'
import date from '../lib/date.js'
import db from '../lib/db.js'
import helper from '../lib/helper.js'
import logger from '../lib/logger.js'
import sp from './sp.base.js'

const collectionName = fileURLToPath(import.meta.url)
  .split('/')
  .pop()
  .split('.')[0]

async function requestApiAndSaveDb (
  startDate, endDate
) {
  try {
    const PostedAfter = date.transformDateToISO(
      startDate,
      'full',
      true,
      true
    )

    const PostedBefore = date.transformDateToISO(
      endDate,
      'full',
      true,
      true
    )

    const params = {
      PostedAfter,
      PostedBefore
    }

    const processedDate = date.getNowFullDateLAISO()
    const shortDate = date.formatDateToShortDateISO(startDate)
    let result = await request(params)
    const data = result.FinancialEvents

    while (result.NextToken) {
      logger.debug('NextToken found, requesting more data...')
      const nextParams = { NextToken: result.NextToken }
      result = await request(nextParams)
      for (const key in result.FinancialEvents) {
        if (Array.isArray(result.FinancialEvents[key])) {
          data[key] = [
            ...data[key],
            ...result.FinancialEvents[key]
          ]
        }
      }
      logger.debug('Data merged with previous data...')
      logger.debug('Sleeping for 1 second...')
      helper.sleep(1)
    }
    logger.debug('No more next token, saving data...')

    await saveDB(
      data,
      shortDate,
      processedDate
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
    logger.debug(JSON.stringify(
      params,
      null,
      2
    ))

    const result = await sp.callAPI({
      operation: 'listFinancialEvents',
      endpoint: 'finances',
      query: params
    })

    logger.info('Data received from API')
    return result
  } catch (err) {
    logger.error(err)
    throw err
  }
}

async function saveDB (
  data, date, processedDate
) {
  logger.info('Updating data to DB...')

  const dataToSave = {
    date,
    processedDate,
    data
  }

  try {
    const existingData = await db.collection(collectionName)
      .findOne({ date })
    if (!existingData) {
      await db.collection(collectionName)
        .insertOne(dataToSave)
    } else {
      await db.collection(collectionName)
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
      .collection('finances')
      .findOne({ date: shortDate })
    return result
  } catch (error) {
    logger.error(error)
    throw error
  }
}

export default {
  requestApiAndSaveDb,
  getDB
}
