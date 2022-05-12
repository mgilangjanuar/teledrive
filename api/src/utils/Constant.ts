import { randomBytes } from 'crypto'
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'fs'

export const TG_CREDS = {
  apiId: Number(process.env.TG_API_ID),
  apiHash: process.env.TG_API_HASH
}

// export const COOKIE_AGE = 3.154e+12
export const COOKIE_AGE = 54e6

export const CONNECTION_RETRIES = 10

export const PROCESS_RETRY = 50


// generate random secret keys
const keys = existsSync(`${__dirname}/../../../keys`) ? readFileSync(`${__dirname}/../../../keys`, 'utf-8') : null
const [apiSecret, filesSecret] = keys?.toString()?.split('\n') || [null, null]
if (!process.env.API_JWT_SECRET) {
  process.env.API_JWT_SECRET = apiSecret || randomBytes(48).toString('base64')
  writeFileSync(`${__dirname}/../../../keys`, process.env.API_JWT_SECRET)
}
if (!process.env.FILES_JWT_SECRET) {
  process.env.FILES_JWT_SECRET = filesSecret || randomBytes(48).toString('base64')
  appendFileSync(`${__dirname}/../../../keys`, `\n${process.env.FILES_JWT_SECRET}`)
}

export const API_JWT_SECRET = process.env.API_JWT_SECRET
export const FILES_JWT_SECRET = process.env.FILES_JWT_SECRET