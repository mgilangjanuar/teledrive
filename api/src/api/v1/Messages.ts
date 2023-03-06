import { Api } from 'telegram'
import bigInt from 'big-integer'
import { Request, Response } from 'express'
import { Redis } from '../../service/Cache'
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
        channelId: bigInt(id),
        accessHash: bigInt(accessHash as string) })
    } else if (type === 'chat') {
      peer = new Api.InputPeerChat({
        chatId: bigInt(id)
      })
    } else if (type === 'user') {
      peer = new Api.InputPeerUser({
        userId: bigInt(id),
        accessHash: bigInt(accessHash as string) })
    }

    const result = await Redis.connect().getFromCacheFirst(`history:${req.user.id}:${JSON.stringify(req.params)}:${JSON.stringify(req.query)}`, async () => {
      const messages = await req.tg.invoke(new Api.messages.GetHistory({
        peer: peer,
        limit: Number(limit) || 0,
        offsetId: Number(offset) || 0,
      }))
      const result = JSON.parse(JSON.stringify(messages))
      result.messages = result.messages?.map((msg, i) => ({ ...msg, action: { ...msg.action, className: messages['messages'][i]?.action?.className } }))
      return result
    }, 2)
    return res.send({ messages: result })
  }

  @Endpoint.GET('/sponsoredMessages/:type/:id', { middlewares: [Auth] })
  public async sponsoredMessages(req: Request, res: Response): Promise<any> {
    const { type, id } = req.params
    const { accessHash } = req.query

    let peer: Api.InputPeerChannel
    if (type === 'channel') {
      peer = new Api.InputPeerChannel({
        channelId: bigInt(id),
        accessHash: bigInt(accessHash as string) })
    } else {
      return res.send({ messages: {
        messages: [],
        chats: [],
        users: []
      } })
    }
    const messages = await req.tg.invoke(new Api.channels.GetSponsoredMessages({ channel: peer }))
    return res.send({ messages })
  }

  @Endpoint.POST('/readSponsoredMessages/:type/:id', { middlewares: [Auth] })
  public async readSponsoredMessages(req: Request, res: Response): Promise<any> {
    const { type, id } = req.params
    const { accessHash } = req.query
    const { random_id: randomId } = req.body

    let peer: Api.InputPeerChannel
    if (type === 'channel') {
      peer = new Api.InputPeerChannel({
        channelId: bigInt(id),
        accessHash: bigInt(accessHash as string) })
    } else {
      return res.status(202).send({ accepted: true })
    }
    const accepted = await req.tg.invoke(new Api.channels.ViewSponsoredMessage({
      channel: peer, randomId: Buffer.from(randomId)
    }))
    return res.status(202).send({ accepted })
  }

  @Endpoint.POST('/read/:type/:id', { middlewares: [Auth] })
  public async read(req: Request, res: Response): Promise<any> {
    const { type, id } = req.params
    const { accessHash } = req.query

    let peer: Api.InputPeerChannel | Api.InputPeerUser | Api.InputPeerChat
    if (type === 'channel') {
      peer = new Api.InputPeerChannel({
        channelId: bigInt(id),
        accessHash: bigInt(accessHash as string) })
    } else if (type === 'chat') {
      peer = new Api.InputPeerChat({
        chatId: bigInt(id)
      })
    } else if (type === 'user') {
      peer = new Api.InputPeerUser({
        userId: bigInt(id),
        accessHash: bigInt(accessHash as string) })
    }

    try {
      await req.tg.invoke(new Api.messages.ReadHistory({ peer }))
    } catch (error) {
      await req.tg.invoke(new Api.channels.ReadHistory({ channel: peer }))
    }
    return res.status(202).send({ accepted: true })
  }

  @Endpoint.POST('/send/:type/:id', { middlewares: [Auth] })
  public async send(req: Request, res: Response): Promise<any> {
    const { type, id } = req.params
    const { accessHash } = req.query
    const { message, replyToMsgId } = req.body

    let peer: Api.InputPeerChannel | Api.InputPeerUser | Api.InputPeerChat
    if (type === 'channel') {
      peer = new Api.InputPeerChannel({
        channelId: bigInt(id),
        accessHash: bigInt(accessHash as string) })
    } else if (type === 'chat') {
      peer = new Api.InputPeerChat({
        chatId: bigInt(id)
      })
    } else if (type === 'user') {
      peer = new Api.InputPeerUser({
        userId: bigInt(id),
        accessHash: bigInt(accessHash as string) })
    }

    const result = await req.tg.invoke(new Api.messages.SendMessage({
      peer,
      message,
      // ...replyToMsgId ? { replyToMsgId: new Api.InputMessageReplyTo({ id: bigInt(replyToMsgId) }) } : {}
      ...replyToMsgId ? { replyToMsgId: replyToMsgId } : {}
    }))
    return res.send({ message: result })
  }

  @Endpoint.PATCH('/:type/:id/:msgId', { middlewares: [Auth] })
  public async update(req: Request, res: Response): Promise<any> {
    const { type, id, msgId } = req.params
    const { accessHash } = req.query
    const { message } = req.body

    let peer: Api.InputPeerChannel | Api.InputPeerUser | Api.InputPeerChat
    if (type === 'channel') {
      peer = new Api.InputPeerChannel({
        channelId: bigInt(id),
        accessHash: bigInt(accessHash as string) })
    } else if (type === 'chat') {
      peer = new Api.InputPeerChat({
        chatId: bigInt(id)
      })
    } else if (type === 'user') {
      peer = new Api.InputPeerUser({
        userId: bigInt(id),
        accessHash: bigInt(accessHash as string) })
    }

    const result = await req.tg.invoke(new Api.messages.EditMessage({
      id: Number(msgId),
      peer,
      message
    }))
    return res.send({ message: result })
  }

  @Endpoint.DELETE('/:type/:id/:msgId', { middlewares: [Auth] })
  public async delete(req: Request, res: Response): Promise<any> {
    const { type, id, msgId } = req.params
    const { accessHash } = req.query

    let peer: Api.InputPeerChannel | Api.InputPeerUser | Api.InputPeerChat
    if (type === 'channel') {
      peer = new Api.InputPeerChannel({
        channelId: bigInt(id),
        accessHash: bigInt(accessHash as string) })
    } else if (type === 'chat') {
      peer = new Api.InputPeerChat({
        chatId: bigInt(id)
      })
    } else if (type === 'user') {
      peer = new Api.InputPeerUser({
        userId: bigInt(id),
        accessHash: bigInt(accessHash as string) })
    }

    try {
      await req.tg.invoke(new Api.messages.DeleteMessages({ id: [Number(msgId)], revoke: true }))
    } catch (error) {
      await req.tg.invoke(new Api.channels.DeleteMessages({ id: [Number(msgId)], channel: peer }))
    }
    return res.status(202).send({ accepted: true })
  }

  @Endpoint.POST('/forward/:msgId', { middlewares: [Auth] })
  public async forward(req: Request, res: Response): Promise<any> {
    const { msgId } = req.params
    const { from, to } = req.body as { from?: {
      type: string,
      id: number,
      accessHash?: string
    }, to: {
      type: string,
      id: number,
      accessHash?: string
    } | string }

    let fromPeer: Api.InputPeerChannel | Api.InputPeerUser | Api.InputPeerChat | 'me'
    let toPeer: Api.InputPeerChannel | Api.InputPeerUser | Api.InputPeerChat | string
    if (!from) {
      fromPeer = 'me'
    } else if (from.type === 'channel') {
      fromPeer = new Api.InputPeerChannel({
        channelId: bigInt(from.id),
        accessHash: bigInt(from.accessHash as string) })
    } else if (from.type === 'chat') {
      fromPeer = new Api.InputPeerChat({
        chatId: bigInt(from.id)
      })
    } else if (from.type === 'user') {
      fromPeer = new Api.InputPeerUser({
        userId: bigInt(from.id),
        accessHash: bigInt(from.accessHash as string) })
    }

    if (typeof to === 'string') {
      toPeer = to
    } else if (to.type === 'channel') {
      toPeer = new Api.InputPeerChannel({
        channelId: bigInt(to.id),
        accessHash: bigInt(to.accessHash as string) })
    } else if (to.type === 'chat') {
      toPeer = new Api.InputPeerChat({
        chatId: bigInt(to.id)
      })
    } else if (to.type === 'user') {
      toPeer = new Api.InputPeerUser({
        userId: bigInt(to.id),
        accessHash: bigInt(to.accessHash as string) })
    }

    const result = await req.tg.invoke(new Api.messages.ForwardMessages({
      id: [Number(msgId)],
      fromPeer,
      toPeer,
      randomId: [bigInt.randBetween('-1e100', '1e100')]
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
      hash: bigInt(0),
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
        channelId: bigInt(id),
        accessHash: bigInt(req.query.accessHash as string) })
    } else if (type === 'chat') {
      peer = new Api.InputPeerChat({
        chatId: bigInt(id)
      })
    } else if (type === 'user') {
      peer = new Api.InputPeerUser({
        userId: bigInt(id),
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
      return res.redirect('https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png')
    }
  }
}