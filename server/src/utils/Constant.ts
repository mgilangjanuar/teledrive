export const TG_CREDS = {
  apiId: Number(process.env.TG_API_ID),
  apiHash: process.env.TG_API_HASH
}

// export const COOKIE_AGE = 3.154e+12
export const COOKIE_AGE = 54e6

export const CONNECTION_RETRIES = 10

export const PLANS = {
  free: {
    sharedFiles: 30,
    publicFiles: 10,
    sharingUsers: 5
  },
  premium: {
    sharedFiles: 400,
    publicFiles: 200,
    sharingUsers: 60
  },
  business: {
    sharedFiles: Infinity,
    publicFiles: Infinity,
    sharingUsers: Infinity
  }
}
