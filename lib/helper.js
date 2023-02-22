import date from '../lib/date.js'
import db from '../lib/db.js'

async function sleep (seconds) {
  await new Promise((resolve) => setTimeout(
    resolve,
    seconds * 1000
  ))
  return true
}

async function addNewJobExecution (
  jobName, status, elapsedTime, message
) {
  const jobs = db.collection('jobs')

  const newJob = {
    jobName,
    status,
    elapsedTime,
    message,
    date: date.getNowFullDateLAISO()
  }
  await jobs.insertOne(newJob)
}

export default {
  sleep, addNewJobExecution
}
