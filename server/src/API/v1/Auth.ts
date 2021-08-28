import { Request, Response } from 'express'
import { Endpoints } from '../base/Endpoints'

export class Auth {

  @Endpoints.route(Auth)
  public test(req: Request, res: Response): any {
    if (req.query.error) throw { status: 400, body: { error: 'test' } }
    return res.send({ test: true })
  }

}