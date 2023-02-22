import date from '../lib/date.js'
import helper from '../lib/helper.js'
import logger from '../lib/logger.js'
import sp from './sp.base.js'

async function createReport (params) {
  logger.debug(`creating report ${params.reportType}`)

  logger.debug(`params: ${JSON.stringify(
    params,
    null,
    2
    )}`)

  const response = await sp.callAPI({
    operation: 'createReport',
    endpoint: 'reports',
    body: params,
    options: { version: '2021-06-30' }
  })
  const { reportId } = response

  return reportId
}

async function getReport (reportId) {
  logger.debug(`processing report ${reportId}`)

  let response
  let reportStatus = 'IN_PROGRESS'

  let sleepTime = 1
  while (reportStatus === 'IN_PROGRESS' || reportStatus === 'IN_QUEUE') {
    logger.debug(`report generation in progress (${reportStatus}), sleeping for ${sleepTime.toFixed(2)} seconds`)
    await helper.sleep(sleepTime); sleepTime *= 1.5

    response = await sp.callAPI({
      operation: 'getReport',
      endpoint: 'reports',
      path: { reportId },
      options: { version: '2021-06-30' }
    })

    reportStatus = response.processingStatus
  }

  if (reportStatus === 'CANCELLED' || reportStatus === 'FATAL') {
    logger.error(`report generation failed with status ${reportStatus}`)
    throw new Error(`report generation failed with status ${reportStatus}`)
  }

  const { reportDocumentId } = response

  return reportDocumentId
}

async function getReportDocument (reportDocumentId) {
  logger.debug(`getting report document ${reportDocumentId}`)

  const response = await sp.callAPI({
    operation: 'getReportDocument',
    endpoint: 'reports',
    path: { reportDocumentId },
    options: { version: '2021-06-30' }
  })

  return response
}

async function downloadDocument (reportDocument) {
  logger.debug(`downloading report ${reportDocument.reportDocumentId}`)

  const reportData = await sp.download(
    reportDocument,
    { json: true }
  )

  return reportData
}

async function createAndProcessReport (params) {
  const processedDate = date.getNowFullDateLAISO()
  const reportId = await createReport(params)
  const reportDocumentId = await getReport(reportId)
  const reportDocument = await getReportDocument(reportDocumentId)
  const reportData = await downloadDocument(reportDocument)

  return {
    reportData, processedDate
  }
}

export default { createAndProcessReport }
