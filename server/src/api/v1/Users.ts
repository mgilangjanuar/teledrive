import { Request, Response } from 'express'
import { Users as Model } from '../../model/entities/Users'
import { buildSort, buildWhereQuery } from '../../utils/FilterQuery'
import { Endpoint } from '../base/Endpoint'
import { Auth } from '../middlewares/Auth'

@Endpoint.API()
export class Users {

  @Endpoint.GET('/:username/:photo?', { middlewares: [Auth] })
  public async retrieve(req: Request, res: Response): Promise<any> {
    const { username, photo } = req.params
    if (photo === 'photo') {
      const file = await req.tg.downloadProfilePhoto(username, { isBig: false })
      res.setHeader('Content-Disposition', `inline; filename=${username === 'me' ? req.user.username : username}.jpg`)
      res.setHeader('Content-Type', 'image/jpeg')
      res.setHeader('Content-Length', file.length)
      res.write(file)
      return res.end()
    }

    const user = await Model.findOne({ username: username === 'me' ? req.user.username : username })
    if (!user) {
      throw { status: 404, body: { error: 'User not found' } }
    }

    return res.send({ user })
  }

  @Endpoint.GET('/', { middlewares: [Auth] })
  public async find(req: Request, res: Response): Promise<any> {
    const { sort, skip, take, ...filters } = req.query
    const users = await Model.createQueryBuilder('users')
      .where(buildWhereQuery(filters))
      .skip(Number(skip) || undefined)
      .take(Number(take) || undefined)
      .orderBy(buildSort(sort as string))
      .getMany()
    return res.send({ users })
  }
}