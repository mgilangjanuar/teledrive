import { Router } from 'express'

export const API = Router()
  .get('/example', (_, res) => res.send('hello'))