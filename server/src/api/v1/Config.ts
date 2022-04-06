import { Request, Response } from 'express'
import { Config as ConfigModel } from '../../model/entities/Config'
import { Users } from '../../model/entities/Users'
import { Endpoint } from '../base/Endpoint'
import { Auth } from '../middlewares/Auth'

@Endpoint.API()
export class Config {

  @Endpoint.GET('/')
  public async retrieve(_: Request, res: Response): Promise<any> {
    // admin creation
    let admin = await Users.findOne({ role: 'admin' })
    if (!admin && process.env.ADMIN_USERNAME) {
      admin = await Users.findOne({ username: process.env.ADMIN_USERNAME })
      admin.role = 'admin'
      await admin.save()
    }

    // get or create base config
    let config = await ConfigModel.findOne()
    if (!config) {
      config = new ConfigModel()
      config.disable_signup = false
      config.invitation_code = null
      await config.save()
    }
    return res.send({ config })
  }

  @Endpoint.PATCH('/', { middlewares: [Auth] })
  public async update(req: Request, res: Response): Promise<any> {
    if (req.user.role !== 'admin') {
      throw { status: 403, body: { error: 'Forbidden' } }
    }
    const { config } = req.body
    if (!config) {
      throw { status: 400, body: { error: 'Invalid request' } }
    }
    const model = await ConfigModel.findOne()
    model.disable_signup = config.disable_signup
    model.invitation_code = config.invitation_code
    await model.save()
    return res.send({ config: model })
  }
}