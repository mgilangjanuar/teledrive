import crypto from 'crypto'
import { Request, Response } from 'express'
import { prisma } from '../../model'
import { Redis } from '../../service/Cache'
import { Endpoint } from '../base/Endpoint'
import { Auth, AuthMaybe } from '../middlewares/Auth'

@Endpoint.API()
export class Config {

  @Endpoint.GET('/', { middlewares: [AuthMaybe] })
  public async retrieve(req: Request, res: Response): Promise<any> {
    // admin creation
    let admin = await prisma.users.findFirst({ where: { role: 'admin' } })
    if (!admin && process.env.ADMIN_USERNAME) {
      admin = await prisma.users.findFirst({ where: { username: process.env.ADMIN_USERNAME } })
      if (!admin) {
        throw { status: 404, body: { error: 'Admin user not found' } }
      }
      await prisma.users.update({
        data: {
          role: 'admin'
        },
        where: { id: admin.id }
      })
      await Redis.connect().del(`auth:${req.authKey}`)
    }

    // get or create base config
    let config = await prisma.config.findFirst()
    if (!config) {
      config = await prisma.config.create({
        data: {
          disable_signup: false,
          invitation_code: null
        }
      })
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
    const model = await prisma.config.findFirst()
    await prisma.config.update({
      data: {
        disable_signup: config.disable_signup,
        ...config.clear_invitation_code ? { invitation_code: null } : {}
      },
      where: { id: model.id }
    })
    return res.send({ config: model })
  }

  @Endpoint.POST('/resetInvitationCode', { middlewares: [Auth] })
  public async resetInvitationCode(req: Request, res: Response): Promise<any> {
    if (req.user.role !== 'admin') {
      throw { status: 403, body: { error: 'Forbidden' } }
    }

    const code = crypto.randomBytes(9).toString('base64url')
    const model = await prisma.config.findFirst()
    await prisma.config.update({
      data: {
        invitation_code: code
      },
      where: { id: model.id }
    })
    return res.send({ config: model })
  }

  @Endpoint.POST('/validateInvitationCode')
  public async validateInvitationCode(req: Request, res: Response): Promise<any> {
    const model = await prisma.config.findFirst()
    if (!model.invitation_code) {
      return res.send({ valid: true })
    }
    const { code } = req.query
    return res.send({
      valid: model.invitation_code === code
    })
  }
}