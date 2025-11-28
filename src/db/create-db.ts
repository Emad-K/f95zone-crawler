import * as dotenv from 'dotenv'
import { Client } from 'pg'

dotenv.config()

async function createDatabase() {
  // Connect to the default 'postgres' database to create the new one
  const connectionString = process.env.DATABASE_URL?.replace('f95zone_crawler', 'postgres')

  if (!connectionString) {
    console.error('DATABASE_URL is not defined')
    process.exit(1)
  }

  const client = new Client({ connectionString })

  try {
    await client.connect()
    // Check if database exists
    const res = await client.query('SELECT 1 FROM pg_database WHERE datname = \'f95zone_crawler\'')
    if (res.rowCount === 0) {
      console.log('Creating database \'f95zone_crawler\'...')
      await client.query('CREATE DATABASE f95zone_crawler')
      console.log('Database created successfully.')
    }
    else {
      console.log('Database \'f95zone_crawler\' already exists.')
    }
  }
  catch (err) {
    console.error('Error creating database:', err)
  }
  finally {
    await client.end()
  }
}

createDatabase()
