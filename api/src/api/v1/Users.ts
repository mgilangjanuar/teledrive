import { Prisma } from '@prisma/client'
import axios from 'axios'
import { Request, Response } from 'express'
import moment from 'moment'
import { Api } from 'telegram'
import { prisma } from '../../model'
import { Redis } from '../../service/Cache'
import { buildSort } from '../../utils/FilterQuery'
import { markdownSafe } from '../../utils/StringParser'
import { Endpoint } from '../base/Endpoint'
import { Auth, AuthMaybe } from '../middlewares/Auth'

@Endpoint.API()
export class Users {

  @Endpoint.GET({ middlewares: [Auth] })
  public async search(req: Request, res: Response): Promise<any> {
    const { username, limit } = req.query
    if (!username) {
      throw { status: 400, body: { error: 'Username is required' } }
    }
    const data = await req.tg.invoke(new Api.contacts.Search({
      q: username as string,
      limit: Number(limit) || 10
    }))
    return res.send({ users: data.users })
  }

  @Endpoint.GET('/me/usage', { middlewares: [AuthMaybe] })
  public async usage(req: Request, res: Response): Promise<any> {
    let usage = await prisma.usages.findUnique({ where: { key: req.user ? `u:${req.user.id}` : `ip:${req.headers['cf-connecting-ip'] as string || req.ip}` } })
    if (!usage) {
      usage = await prisma.usages.create({
        data: {
          key: req.user ? `u:${req.user.id}` : `ip:${req.headers['cf-connecting-ip'] as string || req.ip}`,
          usage: 0,
          expire: moment().add(1, 'day').toDate()
        }
      })
    }

    if (new Date().getTime() - new Date(usage.expire).getTime() > 0) {   // is expired
      await prisma.usages.update({
        where: { key: usage.key },
        data: {
          expire: moment().add(1, 'day').toDate(),
          usage: 0,
        }
      })
    }

    return res.send({ usage })
  }

  @Endpoint.GET('/', { middlewares: [Auth] })
  public async find(req: Request, res: Response): Promise<any> {
    const { sort, offset, limit, search, ...filters } = req.query
    const where = {
      ...search ? {
        OR: [
          { username: { contains: search } },
          { name: { contains: search } },
        ]
      } : filters
    }
    return res.send({ users: await prisma.users.findMany({
      where,
      select: req.user.role === 'admin' ? {
        id: true,
        username: true,
        name: true,
        role: true,
        created_at: true,
      } : { username: true },
      skip: Number(offset) || undefined,
      take: Number(limit) || undefined,
      orderBy: buildSort(sort as string)
    }), length: await prisma.users.count({ where }) })
  }

  @Endpoint.PATCH('/me/settings', { middlewares: [Auth] })
  public async settings(req: Request, res: Response): Promise<any> {
    const { settings } = req.body
    // if (settings.theme === 'dark' && (!req.user.plan || req.user.plan === 'free') && moment().format('l') !== '2/2/2022') {
    //   throw { status: 402, body: { error: 'You need to upgrade your plan to use dark theme' } }
    // }
    // if (settings.saved_location && (!req.user.plan || req.user.plan === 'free') && moment().format('l') !== '2/2/2022') {
    //   throw { status: 402, body: { error: 'You need to upgrade your plan to use this feature' } }
    // }
    req.user.settings = {
      ...req.user.settings as Prisma.JsonObject || {},
      ...settings
    }
    await prisma.users.update({
      where: { id: req.user.id },
      data: req.user
    })
    await Redis.connect().del(`auth:${req.authKey}`)
    return res.send({ settings: req.user?.settings })
  }

  @Endpoint.POST('/me/delete', { middlewares: [Auth] })
  public async remove(req: Request, res: Response): Promise<any> {
    const { reason, agreement } = req.body
    if (agreement !== 'permanently removed') {
      throw { status: 400, body: { error: 'Invalid agreement' } }
    }
    if (reason && process.env.TG_BOT_TOKEN && process.env.TG_BOT_OWNER_ID) {
      await axios.post(`https://api.telegram.org/bot${process.env.TG_BOT_TOKEN}/sendMessage`, {
        chat_id: process.env.TG_BOT_OWNER_ID,
        parse_mode: 'Markdown',
        text: `😭 ${markdownSafe(req.user.name)} (@${markdownSafe(req.user.username)}) removed their account.\n\nReason: ${markdownSafe(reason)}\n\nfrom: \`${markdownSafe(req.headers['cf-connecting-ip'] as string || req.ip)}\`\ndomain: \`${req.headers['authority'] || req.headers.origin}\`${req.user ? `\nplan: ${req.user.plan}` : ''}`
      })
    }
    await prisma.files.deleteMany({
      where: { user_id: req.user.id }
    })
    await prisma.users.delete({ where: { id: req.user.id } })
    const success = await req.tg.invoke(new Api.auth.LogOut())
    return res.clearCookie('authorization').clearCookie('refreshToken').send({ success })
  }

  @Endpoint.GET('/:username/:param?', { middlewares: [Auth] })
  public async retrieve(req: Request, res: Response): Promise<any> {
    const { username, param } = req.params
    if (param === 'photo') {
      const file = await req.tg.downloadProfilePhoto(username, { isBig: false })
      if (!file?.length) {
        return res.redirect('https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png')
      }
      res.setHeader('Cache-Control', 'public, max-age=604800')
      res.setHeader('ETag', Buffer.from(file).toString('base64').slice(10, 50))
      res.setHeader('Content-Disposition', `inline; filename=${username === 'me' ? req.user.username : username}.jpg`)
      res.setHeader('Content-Type', 'image/jpeg')
      res.setHeader('Content-Length', file.length)
      res.write(file)
      return res.end()
    }

    const user = username === 'me' || username === req.user.username ? req.user : await prisma.users.findFirst({
      where: {
        OR: [
          { username },
          { id: username }
        ]
      }
    })
    if (!user) {
      throw { status: 404, body: { error: 'User not found' } }
    }

    return res.send({ user })
  }

  @Endpoint.DELETE('/:id', { middlewares: [Auth] })
  public async delete(req: Request, res: Response): Promise<any> {
    if (req.user.role !== 'admin') {
      throw { status: 403, body: { error: 'You are not allowed to do this' } }
    }
    const { id } = req.params
    await prisma.files.deleteMany({
      where: { user_id: id }
    })
    await prisma.users.delete({ where: { id } })
    return res.send({})
  }

  @Endpoint.PATCH('/:id', { middlewares: [Auth] })
  public async update(req: Request, res: Response): Promise<any> {
    if (req.user.role !== 'admin') {
      throw { status: 403, body: { error: 'You are not allowed to do this' } }
    }
    const { id } = req.params
    const { user } = req.body
    if (!user) {
      throw { status: 400, body: { error: 'User is required' } }
    }
    await prisma.users.update({
      where: { id },
      data: { role: user?.role }
    })
    return res.send({})
  }
}