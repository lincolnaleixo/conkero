import db from './db.js'

let configDB = {}

try {
  configDB = await db.collection('config')
    .findOne({})
} catch (error) {
  console.log('Could not get the config from the database')
  console.log(error)
  throw error
}

export default configDB
