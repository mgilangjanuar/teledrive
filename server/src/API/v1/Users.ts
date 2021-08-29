import { Request, Response } from 'express'
import { Supabase } from '../../service/Supabase'
import { Endpoint } from '../base/Endpoint'
import { Auth } from '../middlewares/Auth'
import { Users as UsersModel } from '../../model/Users'
import { filterQuery } from '../../utils/FilterQuery'

@Endpoint.API()
export class Users {

  @Endpoint.GET({ middlewares: [Auth] })
  public async me(req: Request, res: Response): Promise<any> {
    return res.send({ user: req.user })
  }

  @Endpoint.GET('/:username', { middlewares: [Auth] })
  public async retrieve(req: Request, res: Response): Promise<any> {
    const { username } = req.params
    const { data: user } = await Supabase.build().from<UsersModel>('users')
      .select('*')
      .eq('username', username).single()
    if (!user) {
      throw { status: 404, body: { error: 'User not found' } }
    }

    return res.send({ user })
  }

  @Endpoint.GET('/', { middlewares: [Auth] })
  public async find(req: Request, res: Response): Promise<any> {
    const users = await filterQuery(Supabase.build().from<UsersModel>('users').select('*'), req.query)
    return res.send({ users })
  }
}