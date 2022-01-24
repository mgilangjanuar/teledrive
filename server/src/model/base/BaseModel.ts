import { BaseEntity, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

export class BaseModel extends BaseEntity {
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date
}

export class BaseModelWithID extends BaseModel {
  @PrimaryGeneratedColumn('uuid')
  id: string
}
