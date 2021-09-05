import { Request, Response } from 'express'
import { getRepository } from 'typeorm'
import { Waitings as Model } from '../../model/entities/Waitings'
import { Endpoint } from '../base/Endpoint'

@Endpoint.API()
export class Waitings {

  @Endpoint.POST('/')
  public async create(req: Request, res: Response): Promise<any> {
    const { email } = req.body
    const data = await getRepository<Model>(Model).save({ email: email as string })
    return res.send({ waiting: data })
  }
}