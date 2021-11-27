import { Column, Entity } from 'typeorm'
import { BaseModelWithID } from '../base/BaseModel'

@Entity()
export class Usages extends BaseModelWithID {

  @Column()
  ip: string

  @Column()
  usage: number

  @Column('timestamptz')
  expire: Date
}