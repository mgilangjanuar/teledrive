import { randomBytes } from 'crypto'
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'fs'
import { parse } from 'human-format'

export const TG_CREDS = {
  apiId: Number(process.env.TG_API_ID),
  apiHash: process.env.TG_API_HASH
}

// export const COOKIE_AGE = 3.154e+12
export const COOKIE_AGE = 54e6

export const CONNECTION_RETRIES = 10

export const PROCESS_RETRY = 50

export const CACHE_FILES_LIMIT = parse(process.env.CACHE_FILES_LIMIT || '20GB')

// generate random secret keys
const keys = existsSync(`${__dirname}/../../keys`) ? readFileSync(`${__dirname}/../../keys`, 'utf-8') : null
const [apiSecret, filesSecret] = keys?.toString()?.split('\n') || [
  randomBytes(48).toString('base64'),
  randomBytes(48).toString('base64')
]

if (!process.env.API_JWT_SECRET) {
  process.env.API_JWT_SECRET = apiSecret
  writeFileSync(`${__dirname}/../../keys`, process.env.API_JWT_SECRET)
}
if (!process.env.FILES_JWT_SECRET) {
  process.env.FILES_JWT_SECRET = filesSecret
  appendFileSync(`${__dirname}/../../keys`, `\n${process.env.FILES_JWT_SECRET}`)
}

export const API_JWT_SECRET = process.env.API_JWT_SECRET
export const FILES_JWT_SECRET = process.env.FILES_JWT_SECRET