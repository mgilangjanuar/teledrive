import { Request, Response } from 'express'
import { Endpoint } from '../base/Endpoint'
import { Auth } from '../middlewares/Auth'

@Endpoint.API()
export class Users {

  @Endpoint.GET({ middlewares: [Auth] })
  public async me(req: Request, res: Response): Promise<any> {
    return res.send({ user: req.user })
  }
}