import { Column, Entity, OneToMany } from 'typeorm'
import { BaseModelWithID } from '../base/BaseModel'
import { Files } from './Files'

@Entity()
export class Users extends BaseModelWithID {

  @Column()
  username: string

  @Column({ default: null })
  name?: string

  @Column({ default: null, select: false })
  email?: string

  @Column({ default: null })
  tg_id?: number

  @Column({ default: 'free' })
  plan?: 'free' | 'premium' | 'professional'

  @Column({ default: null })
  subscription_id?: string

  @Column({ default: null })
  plan_expired_at?: Date

  @OneToMany(() => Files, files => files.user)
  files?: Files[]
}