import { Request, Response } from 'express'
import { Api } from 'telegram'
import { Endpoint } from '../base/Endpoint'
import bigInt from 'big-integer'
import { Auth } from '../middlewares/Auth'

@Endpoint.API()
export class Dialogs {

  @Endpoint.GET('/', { middlewares: [Auth] })
  public async find(req: Request, res: Response): Promise<any> {
    const { skip, take } = req.query
    const dialogs = await req.tg.invoke(new Api.messages.GetDialogs({
      offsetDate: Number(skip) || 0,
      offsetPeer: new Api.InputPeerEmpty(),
      limit: Number(take) || 0,
      excludePinned: false
    }))
    return res.send({ dialogs })
  }

  @Endpoint.GET('/:type/:id/avatar.jpg', { middlewares: [Auth] })
  public async avatar(req: Request, res: Response): Promise<any> {
    const { type, id } = req.params
    let peer: Api.InputPeerChannel | Api.InputPeerUser
    if (type === 'channel') {
      peer = new Api.InputPeerChannel({
        channelId: Number(id),
        accessHash: bigInt(req.query.accessHash as string) })
    } else if (type === 'user') {
      peer = new Api.InputPeerUser({
        userId: Number(id),
        accessHash: bigInt(req.query.accessHash as string) })
    }
    const file = await req.tg.downloadProfilePhoto(peer)
    res.setHeader('Content-Disposition', `inline; filename=avatar-${id}.jpg`)
    res.setHeader('Content-Type', 'image/jpeg')
    res.setHeader('Content-Length', file.length)
    res.write(file)
    return res.end()
  }
}