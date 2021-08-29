import { Request, Response } from 'express'
import { Supabase } from '../../service/Supabase'
import { Endpoint } from '../base/Endpoint'
import { Auth } from '../middlewares/Auth'
import { Users as UsersModel } from '../../model/Users'

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
    const { page, size, sort, ...filters } = req.query
    let query = Supabase.build().from<UsersModel>('users').select('*')

    for (const param of Object.keys(filters)) {
      const [column, op] = param.split('.')
      query = query.filter(column as keyof UsersModel, op || 'eq' as any, filters[param])
    }

    if (page && size) {
      query = query.range(Number(size) * Number(page),
        Number(size) * Number(page) + Number(size) - 1)
    }

    if (sort) {
      const [column, type] = sort.toString().split('.')
      query = query.order(column as keyof UsersModel, { ascending: !type || type.toLowerCase() === 'asc' || type.toLowerCase() === 'ascending' })
    }

    const { data: users } = await query
    return res.send({ users })
  }
}