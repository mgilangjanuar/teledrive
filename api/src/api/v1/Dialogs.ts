import { Api } from 'telegram'
import bigInt from 'big-integer'
import { Request, Response } from 'express'
import { Redis } from '../../service/Cache'
import { objectParser } from '../../utils/ObjectParser'
import { Endpoint } from '../base/Endpoint'
import { Auth } from '../middlewares/Auth'

@Endpoint.API()
export class Dialogs {

  @Endpoint.GET('/', { middlewares: [Auth] })
  public async find(req: Request, res: Response): Promise<any> {
    const { offset, limit } = req.query
    const dialogs = await Redis.connect().getFromCacheFirst(`dialogs:${req.user.id}:${JSON.stringify(req.query)}`, async () => {
      return objectParser(await req.tg.getDialogs({
        limit: Number(limit) || 0,
        offsetDate: Number(offset) || undefined,
        ignorePinned: false
      }))
    }, 2)
    return res.send({ dialogs })
  }

  @Endpoint.GET('/:type/:id', { middlewares: [Auth] })
  public async retrieve(req: Request, res: Response): Promise<any> {
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

    const dialogs = await req.tg.invoke(new Api.messages.GetPeerDialogs({
      peers: [new Api.InputDialogPeer({ peer })]
    }))

    const result = objectParser(dialogs) as any
    return res.send({ dialog: {
      ...result,
      dialog: result.dialogs[0],
      message: result.messages[0],
      chat: result.chats[0],
      user: result.users[0],
      dialogs: undefined,
      messages: undefined,
      chats: undefined,
      users: undefined
    } })
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