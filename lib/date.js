function getLADateWithDiffDays (days) {
  const laDate = new Date(new Date()
    .toLocaleString(
      'en-US',
      { timeZone: 'America/Los_Angeles' }
    ))
  laDate.setDate(laDate.getDate() + (days || 0))
  const month = (laDate.getMonth() + 1 < 10) ? (`0${laDate.getMonth() + 1}`) : (laDate.getMonth() + 1)
  const day = (laDate.getDate() < 10) ? (`0${laDate.getDate()}`) : laDate.getDate()
  const year = laDate.getFullYear()
  const hours = (laDate.getHours() < 10) ? (`0${laDate.getHours()}`) : laDate.getHours()
  const minutes = (laDate.getMinutes() < 10) ? (`0${laDate.getMinutes()}`) : laDate.getMinutes()
  const seconds = (laDate.getSeconds() < 10) ? (`0${laDate.getSeconds()}`) : laDate.getSeconds()
  const formatDateISO8601 = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`

  return formatDateISO8601
}

function getLADateWithDiffSeconds (secs = 0) {
  const laDate = new Date(new Date()
    .toLocaleString(
      'en-US',
      { timeZone: 'America/Los_Angeles' }
    ))
  laDate.setSeconds(laDate.getSeconds() - secs)
  const month = (laDate.getMonth() + 1 < 10) ? (`0${laDate.getMonth() + 1}`) : (laDate.getMonth() + 1)
  const day = (laDate.getDate() < 10) ? (`0${laDate.getDate()}`) : laDate.getDate()
  const year = laDate.getFullYear()
  const hours = (laDate.getHours() < 10) ? (`0${laDate.getHours()}`) : laDate.getHours()
  const minutes = (laDate.getMinutes() < 10) ? (`0${laDate.getMinutes()}`) : laDate.getMinutes()
  const seconds = (laDate.getSeconds() < 10) ? (`0${laDate.getSeconds()}`) : laDate.getSeconds()
  const formatDateISO8601 = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`

  return formatDateISO8601
}

function getNowFullDateLAISO () {
  const laDate = new Date(new Date()
    .toLocaleString(
      'en-US',
      { timeZone: 'America/Los_Angeles' }
    ))

  const month = (laDate.getMonth() + 1 < 10) ? (`0${laDate.getMonth() + 1}`) : (laDate.getMonth() + 1)
  const day = (laDate.getDate() < 10) ? (`0${laDate.getDate()}`) : laDate.getDate()
  const year = laDate.getFullYear()
  const hours = (laDate.getHours() < 10) ? (`0${laDate.getHours()}`) : laDate.getHours()
  const minutes = (laDate.getMinutes() < 10) ? (`0${laDate.getMinutes()}`) : laDate.getMinutes()
  const seconds = (laDate.getSeconds() < 10) ? (`0${laDate.getSeconds()}`) : laDate.getSeconds()
  const formatDateISO8601 = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`

  return formatDateISO8601
}

function getLAOffset () {
  const pacificTime = new Date()
    .toLocaleString(
      'en-US',
      { timeZone: 'America/Los_Angeles' }
    )
  const utcTime = new Date()
    .toLocaleString(
      'en-US',
      { timeZone: 'UTC' }
    )
  const LAOffset = `-0${((new Date(pacificTime) - new Date(utcTime)) / 1000 / 60 / 60).toString()
        .substring(
        1,
        2
        )}:00`

  return LAOffset
}

function transformDateToISO (
  date, type, offset, startOfDay = false
) {
  let fmtDate = new Date(date)

  let hours
  if (startOfDay) {
    hours = 'T00:00:00'
  }

  if (type === 'full') {
    fmtDate = formatDateToFullDateISO(fmtDate)
    if (startOfDay) {
      fmtDate = fmtDate.replace(
        fmtDate.substring(
          11,
          19
        ),
        hours.substring(
          1,
          9
        )
      )
    }
  } else if (type === 'short') {
    fmtDate = formatDateToShortDateISO(fmtDate)
    return fmtDate
  }

  if (offset) {
    const LAOffset = getLAOffset()
    fmtDate = formatDateISO8601(fmtDate)
    fmtDate = `${fmtDate}${hours}${LAOffset}`
    return fmtDate
  }

  return formatDateToFullDateISO(fmtDate)
}

function formatDateISO8601 (date) {
  const d = new Date(date)
  const month = (d.getMonth() + 1 < 10) ? (`0${d.getMonth() + 1}`) : (d.getMonth() + 1)
  const day = (d.getDate() < 10) ? (`0${d.getDate()}`) : d.getDate()
  const year = d.getFullYear()
  return `${year}-${month}-${day}`
}

function formatDateToFullDateISO (date) {
  const today = new Date(date)
  const month = (today.getMonth() + 1 < 10) ? (`0${today.getMonth() + 1}`) : (today.getMonth() + 1)
  const day = (today.getDate() < 10) ? (`0${today.getDate()}`) : today.getDate()
  const year = today.getFullYear()
  const hours = (today.getHours() < 10) ? (`0${today.getHours()}`) : today.getHours()
  const minutes = (today.getMinutes() < 10) ? (`0${today.getMinutes()}`) : today.getMinutes()
  const seconds = (today.getSeconds() < 10) ? (`0${today.getSeconds()}`) : today.getSeconds()
  const formatDateISO8601 = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
  return formatDateISO8601
}

function formatDateToShortDateISO (date) {
  return formatDateToFullDateISO(date)
    .substring(
      0,
      10
    )
}

export default {
  getNowFullDateLAISO,
  getLADateWithDiffDays,
  transformDateToISO,
  formatDateToFullDateISO,
  formatDateToShortDateISO,
  getLADateWithDiffSeconds
}
