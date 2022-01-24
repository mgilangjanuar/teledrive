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
  message_id?: string

  @Column({ default: null })
  mime_type?: string

  @Column('bigint', { default: null })
  size?: string

  @Column({ type: 'timestamptz', default: null })
  uploaded_at?: Date

  @Column('double precision', { default: null })
  upload_progress?: number

  @Column()
  user_id: string

  @ManyToOne(
    () => Users,
    users => users.files,
    { onUpdate: 'CASCADE', onDelete: 'CASCADE' }
  )
  user?: Users

  @Column({ default: null })
  parent_id?: string

  @ManyToOne(
    () => Files,
    file => file.children,
    { onUpdate: 'CASCADE', onDelete: 'CASCADE' }
  )
  parent?: Files

  @OneToMany(() => Files, file => file.parent)
  children?: Files[]

  @DeleteDateColumn({ type: 'timestamptz' })
  deleted_at?: Date

  @Column('varchar', { array: true, default: null })
  sharing_options?: string[]

  @Column({ default: null, select: false })
  signed_key?: string

  @Column({ default: null, select: false })
  file_id?: string

  @Column({ default: null })
  link_id?: string

  @ManyToOne(
    () => Files,
    file => file.links,
    { onUpdate: 'CASCADE', onDelete: 'CASCADE' }
  )
  link?: Files

  @OneToMany(() => Files, file => file.link)
  links?: Files[]

  @Column({ default: null })
  forward_info?: string
}
