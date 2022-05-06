import { NextFunction, Request, Response } from 'express'

export async function AuthKey(req: Request, _: Response, next: NextFunction): Promise<any> {
  const authkey = req.headers['token'] || req.query['token']
  if (authkey !== process.env.UTILS_API_KEY) {
    throw { status: 401, body: { error: 'Invalid key' } }
  }

  return next()
}