import { Column, Entity } from 'typeorm'
import { BaseModelWithID } from '../base/BaseModel'

@Entity()
export class Links extends BaseModelWithID {

  @Column()
  signed_key: string

  @Column()
  shorten: string
}