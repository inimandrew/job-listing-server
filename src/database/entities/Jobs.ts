import { Entity, PrimaryKey, Property, Enum, ManyToOne, OneToMany, Collection } from '@mikro-orm/core';
import { Users } from './Users';
import { Companies } from './Companies';
import { Applications } from './Applications';
enum VerifiedStatus {
  TRUE = "true",
  FALSE = "false",
}

@Entity()
export class Jobs {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Users, { lazy: true })
  user!: Users;

  @ManyToOne(() => Companies, { nullable: true, lazy: true })
  company!: Companies;

  @Property()
  title!: string;

  @Property({ columnType: 'text', lazy: true })
  description!: string;

  @Enum({ items: () => VerifiedStatus, default: VerifiedStatus.FALSE })
  status!: VerifiedStatus;

  @OneToMany(() => Applications, job_applications => job_applications.job)
  job_applications = new Collection<Applications>(this);

  @Property({ type: Date })
  createdAt = new Date();

  @Property({ onUpdate: () => new Date(), type: Date })
  updatedAt = new Date();

}
