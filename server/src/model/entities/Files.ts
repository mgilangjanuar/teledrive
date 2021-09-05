import { Column, Entity } from 'typeorm'
import { BaseModelWithID } from '../base/BaseModel'

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
}