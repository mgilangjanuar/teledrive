import { BaseSchema } from './base/Schema'

export interface User extends BaseSchema {
  username: string,
  name?: string,
  tg_id?: number,
  tg_raw?: any
}