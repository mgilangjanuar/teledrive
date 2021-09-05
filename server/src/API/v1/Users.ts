import { Request, Response } from 'express'
import { Users as Model } from '../../model/entities/Users'
import { buildSort, buildWhereQuery } from '../../utils/FilterQuery'
import { Endpoint } from '../base/Endpoint'
import { Auth } from '../middlewares/Auth'

@Endpoint.API()
export class Users {

  @Endpoint.GET({ middlewares: [Auth] })
  public async me(req: Request, res: Response): Promise<any> {
    return res.send({ user: req.user })
  }

  @Endpoint.GET('/:username', { middlewares: [Auth] })
  public async retrieve(req: Request, res: Response): Promise<any> {
    const { username } = req.params
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