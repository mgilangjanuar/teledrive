import { Request, Response } from 'express'
import { Endpoint } from '../base/Endpoint'

@Endpoint.API()
export class Auth {

  @Endpoint.GET()
  public test(req: Request, res: Response): any {
    if (req.query.error) throw { status: 400, body: { error: 'test' } }
    return res.send({ test: true })
  }
}