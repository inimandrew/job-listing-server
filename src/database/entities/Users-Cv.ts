import { Entity, PrimaryKey, Property, ManyToOne, Enum, OneToMany, Collection } from '@mikro-orm/core';
import { Users } from './Users';
import { Applications } from './Applications';

enum defaultStatus {
  TRUE = "true",
  FALSE = "false"
}

@Entity()
export class UserCv {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Users)
  user!: Users;

  @Property()
  file_path!: string

  @Property()
  file_name!: string

  @Enum({ items: () => defaultStatus, default: defaultStatus.TRUE })
  status!: defaultStatus;

  @OneToMany(() => Applications, job_applications => job_applications.cv)
  job_applications = new Collection<Applications>(this);

  @Property({ type: Date })
  createdAt = new Date();


}
