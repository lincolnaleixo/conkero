import { MongoClient } from 'mongodb'
import dbConfig from '../dbCreds.js'

const dbUser = dbConfig.DB_USER
const dbPass = dbConfig.DB_PASS
const dbHost = dbConfig.DB_HOST
const dbName = dbConfig.DB_NAME

const uri = `mongodb://${dbUser}:${dbPass}@${dbHost}/?retryWrites=true&w=majority`
const client = await MongoClient.connect(
  uri,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  },
  (
    err, client
  ) => {
    if (err) {
      console.error(err)
    }
  }
)

const db = await client.db(dbName)

export default db
