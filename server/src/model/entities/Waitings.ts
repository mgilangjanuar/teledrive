import { Column, Entity } from 'typeorm'
import { BaseModelWithID } from '../base/BaseModel'

@Entity()
export class Waitings extends BaseModelWithID {

  @Column()
  email: string
}