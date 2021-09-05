import { Column, Entity, ManyToOne } from 'typeorm'
import { BaseModelWithID } from '../base/BaseModel'
import { Users } from './Users'

@Entity()
export class Files extends BaseModelWithID {

  @Column()
  name: string

  @Column()
  path: string

  @Column({ default: null })
  mime_type?: string

  @Column({ default: null })
  size?: number

  @Column({ default: null })
  uploaded_at?: Date

  @Column('jsonb', { default: null })
  upload_progress?: any

  @Column()
  user_id: string

  @ManyToOne(() => Users, users => users.files, { onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  user?: Users
}