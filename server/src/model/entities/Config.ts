import { Column, Entity } from 'typeorm'
import { BaseModelWithID } from '../base/BaseModel'

@Entity()
export class Config extends BaseModelWithID {

  @Column({ default: false })
  disable_signup: boolean

  @Column({ default: null })
  invitation_code?: string
}