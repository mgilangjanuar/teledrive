import { Column, Entity, PrimaryColumn } from 'typeorm'
import { BaseModel } from '../base/BaseModel'

@Entity()
export class Usages extends BaseModel {

  @PrimaryColumn()
  key: string

  @Column()
  usage: number

  @Column('timestamptz')
  expire: Date
}