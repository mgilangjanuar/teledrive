import { Column, DeleteDateColumn, Entity, ManyToOne, OneToMany } from 'typeorm'
import { BaseModelWithID } from '../base/BaseModel'
import { Users } from './Users'

@Entity()
export class Files extends BaseModelWithID {

  @Column()
  name: string

  @Column({ default: null })
  type?: string

  @Column({ default: null })
  message_id?: number

  @Column({ default: null })
  prev_message_id?: number

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

  @Column({ default: null })
  parent_id?: string

  @ManyToOne(() => Files, file => file.children, { onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  parent?: Files

  @OneToMany(() => Files, file => file.parent)
  children?: Files[]

  @DeleteDateColumn({ type: 'timestamptz' })
  deleted_at?: Date

  @Column('varchar', { array: true, default: null })
  sharing_options?: string[]

  @Column({ default: null, select: false })
  signed_key?: string
}