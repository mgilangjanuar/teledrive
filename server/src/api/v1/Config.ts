import crypto from 'crypto'
import { Request, Response } from 'express'
import { Config as ConfigModel } from '../../model/entities/Config'
import { Users } from '../../model/entities/Users'
import { Endpoint } from '../base/Endpoint'
import { Auth, AuthMaybe } from '../middlewares/Auth'

@Endpoint.API()
export class Config {

  @Endpoint.GET('/', { middlewares: [AuthMaybe] })
  public async retrieve(req: Request, res: Response): Promise<any> {
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
    return res.send({ config: {
      ...config,
      invitation_code: req.user?.role === 'admin' ? config.invitation_code : undefined
    } })
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
    if (config.clear_invitation_code) {
      model.invitation_code = null
    }
    await model.save()
    return res.send({ config: model })
  }

  @Endpoint.POST('/resetInvitationCode', { middlewares: [Auth] })
  public async resetInvitationCode(req: Request, res: Response): Promise<any> {
    if (req.user.role !== 'admin') {
      throw { status: 403, body: { error: 'Forbidden' } }
    }

    const code = crypto.randomBytes(9).toString('base64url')
    const model = await ConfigModel.findOne()
    model.invitation_code = code
    // model.invitation_code = bcrypt.hashSync(code, bcrypt.genSaltSync(10))
    await model.save()
    return res.send({ config: model })
  }

  @Endpoint.POST('/validateInvitationCode')
  public async validateInvitationCode(req: Request, res: Response): Promise<any> {
    const model = await ConfigModel.findOne()
    if (!model.invitation_code) {
      return res.send({ valid: true })
    }
    const { code } = req.query
    return res.send({
      // valid: bcrypt.compareSync(code as string, model.invitation_code)
      valid: model.invitation_code === code
    })
  }
}