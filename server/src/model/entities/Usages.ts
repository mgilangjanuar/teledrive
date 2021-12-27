import { Column, Entity, PrimaryColumn } from 'typeorm'
import { BaseModel } from '../base/BaseModel'

@Entity()
export class Usages extends BaseModel {

  @PrimaryColumn()
  key: string

  @Column('bigint')
  usage: string

  @Column('timestamptz')
  expire: Date
}