import { Request, Response } from 'express'
import { Endpoint } from '../base/Endpoint'

@Endpoint.API()
export class Utils {

  @Endpoint.GET()
  public async maintenance(_: Request, res: Response): Promise<any> {
    return res.send({ maintenance: ['1', 'true', 'yes'].includes(process.env.IS_MAINTENANCE) })
  }
}