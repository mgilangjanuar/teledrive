import { Column, Entity } from 'typeorm'
import { BaseModelWithID } from '../base/BaseModel'

@Entity()
export class Users extends BaseModelWithID {

  @Column()
  username: string

  @Column({ default: null })
  name?: string

  @Column({ default: null })
  tg_id?: number

  @Column('jsonb', { default: null })
  tg_raw?: any
}