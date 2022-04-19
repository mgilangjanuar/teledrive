import { Request, Response } from 'express'
import { prisma } from '../../model'
import { Endpoint } from '../base/Endpoint'

@Endpoint.API()
export class Waitings {

  @Endpoint.POST('/')
  public async create(req: Request, res: Response): Promise<any> {
    const { email } = req.body
    let data = await prisma.waitings.findFirst({ where: { email } })
    if (!data) {
      data = await prisma.waitings.create({
        data: { email }
      })
    }
    return res.send({ success: true })
  }
}