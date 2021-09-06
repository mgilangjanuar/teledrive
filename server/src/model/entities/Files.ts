import { Column, DeleteDateColumn, Entity, ManyToOne } from 'typeorm'
import { BaseModelWithID } from '../base/BaseModel'
import { Users } from './Users'

@Entity()
export class Files extends BaseModelWithID {

  @Column()
  name: string

  @Column()
  path: string

  @Column({ default: null })
  type?: string

  @Column({ default: null })
  message_id?: number

  @Column({ default: null })
  mime_type?: string

  @Column({ default: null })
  size?: number

  @Column({ type: 'timestamptz', default: null })
  uploaded_at?: Date

  @Column({ default: null })
  upload_progress?: number

  @Column()
  user_id: string

  @ManyToOne(() => Users, users => users.files, { onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  user?: Users

  @DeleteDateColumn({ type: 'timestamptz' })
  deleted_at?: Date
}