import bigInt from 'big-integer'
import { Request, Response } from 'express'
import { Api } from 'telegram'
import { Endpoint } from '../base/Endpoint'
import { Auth } from '../middlewares/Auth'

@Endpoint.API()
export class Messages {

  @Endpoint.GET('/history/:type/:id', { middlewares: [Auth] })
  public async history(req: Request, res: Response): Promise<any> {
    const { type, id } = req.params
    const { offset, limit, accessHash } = req.query

    let peer: Api.InputPeerChannel | Api.InputPeerUser | Api.InputPeerChat
    if (type === 'channel') {
      peer = new Api.InputPeerChannel({
        channelId: Number(id),
        accessHash: bigInt(accessHash as string) })
    } else if (type === 'chat') {
      peer = new Api.InputPeerChat({
        chatId: Number(id)
      })
    } else if (type === 'user') {
      peer = new Api.InputPeerUser({
        userId: Number(id),
        accessHash: bigInt(accessHash as string) })
    }

    const messages = await req.tg.invoke(new Api.messages.GetHistory({
      peer: peer,
      limit: Number(limit) || 0,
      offsetId: Number(offset) || 0,
    }))
    return res.send({ messages })
  }

  @Endpoint.POST('/read/:type/:id', { middlewares: [Auth] })
  public async read(req: Request, res: Response): Promise<any> {
    const { type, id } = req.params
    const { accessHash } = req.query

    let peer: Api.InputPeerChannel | Api.InputPeerUser | Api.InputPeerChat
    if (type === 'channel') {
      peer = new Api.InputPeerChannel({
        channelId: Number(id),
        accessHash: bigInt(accessHash as string) })
    } else if (type === 'chat') {
      peer = new Api.InputPeerChat({
        chatId: Number(id)
      })
    } else if (type === 'user') {
      peer = new Api.InputPeerUser({
        userId: Number(id),
        accessHash: bigInt(accessHash as string) })
    }

    if (type === 'user') {
      await req.tg.invoke(new Api.messages.ReadHistory({ peer }))
    } else {
      await req.tg.invoke(new Api.channels.ReadHistory({ channel: peer }))
    }
    return res.status(202).send({ accepted: true })
  }

  @Endpoint.POST('/send/:type/:id', { middlewares: [Auth] })
  public async send(req: Request, res: Response): Promise<any> {
    const { type, id } = req.params
    const { accessHash } = req.query
    const { message } = req.body

    let peer: Api.InputPeerChannel | Api.InputPeerUser | Api.InputPeerChat
    if (type === 'channel') {
      peer = new Api.InputPeerChannel({
        channelId: Number(id),
        accessHash: bigInt(accessHash as string) })
    } else if (type === 'chat') {
      peer = new Api.InputPeerChat({
        chatId: Number(id)
      })
    } else if (type === 'user') {
      peer = new Api.InputPeerUser({
        userId: Number(id),
        accessHash: bigInt(accessHash as string) })
    }

    const result = await req.tg.invoke(new Api.messages.SendMessage({
      peer,
      message
    }))
    return res.send({ message: result })
  }

  @Endpoint.GET('/search', { middlewares: [Auth] })
  public async search(req: Request, res: Response): Promise<any> {
    const { q, offset, limit } = req.query
    if (!q) {
      throw { status: 400, body: { error: 'q is required' } }
    }
    const messages = await req.tg.invoke(new Api.messages.Search({
      q: q as string,
      filter: new Api.InputMessagesFilterEmpty(),
      peer: new Api.InputPeerEmpty(),
      limit: Number(limit) || 0,
      minDate: 0,
      maxDate: 0,
      offsetId: 0,
      addOffset: Number(offset) || 0,
      maxId: 0,
      minId: 0,
      hash: 0,
    }))
    return res.send({ messages })
  }

  @Endpoint.GET('/globalSearch', { middlewares: [Auth] })
  public async globalSearch(req: Request, res: Response): Promise<any> {
    const { q, limit } = req.query
    if (!q) {
      throw { status: 400, body: { error: 'q is required' } }
    }
    const messages = await req.tg.invoke(new Api.messages.SearchGlobal({
      q: q as string,
      filter: new Api.InputMessagesFilterEmpty(),
      offsetPeer: new Api.InputPeerEmpty(),
      limit: Number(limit) || 0
    }))
    return res.send({ messages })
  }

  @Endpoint.GET('/:type/:id/avatar.jpg', { middlewares: [Auth] })
  public async avatar(req: Request, res: Response): Promise<any> {
    const { type, id } = req.params
    let peer: Api.InputPeerChannel | Api.InputPeerUser | Api.InputPeerChat
    if (type === 'channel') {
      peer = new Api.InputPeerChannel({
        channelId: Number(id),
        accessHash: bigInt(req.query.accessHash as string) })
    } else if (type === 'chat') {
      peer = new Api.InputPeerChat({
        chatId: Number(id)
      })
    } else if (type === 'user') {
      peer = new Api.InputPeerUser({
        userId: Number(id),
        accessHash: bigInt(req.query.accessHash as string) })
    }
    try {
      const file = await req.tg.downloadProfilePhoto(peer)
      if (!file?.length) {
        return res.redirect('https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png')
      }
      res.setHeader('Content-Disposition', `inline; filename=avatar-${id}.jpg`)
      res.setHeader('Content-Type', 'image/jpeg')
      res.setHeader('Content-Length', file.length)
      res.write(file)
      return res.end()
    } catch (error) {
      console.error(error)
      return res.redirect('https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png')
    }
  }
}