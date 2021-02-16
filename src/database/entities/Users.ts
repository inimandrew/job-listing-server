import { Entity, PrimaryKey, Property, Unique, Enum, ManyToOne, Collection, OneToMany } from '@mikro-orm/core';
import { Roles } from "./Roles"
import { UserCv } from './Users-Cv';
import { CompaniesUsers } from './Companies-Users';
import { Jobs } from './Jobs';
enum UserStatus {
  DISABLED = "disabled",
  ACTIVE = "active",
  SUSPENDED = "suspended"
}

@Entity()
export class Users {
  @PrimaryKey()
  id!: number;

  @ManyToOne()
  role!: Roles;

  @Property()
  firstname!: string;

  @Property()
  lastname!: string;

  @Property()
  @Unique()
  email!: string;

  @Property({ hidden: true })
  password!: string;

  @Property()
  @Unique()
  phone!: string;

  @Property({ nullable: true })
  image_path!: string;

  @Enum({ items: () => UserStatus, default: UserStatus.DISABLED})
  status!: UserStatus;

  @OneToMany(() => UserCv, cv => cv.user)
  cv = new Collection<UserCv>(this);

  @OneToMany(() => CompaniesUsers, company_users => company_users.user)
  associatedCompanies = new Collection<CompaniesUsers>(this);

  @OneToMany(() => Jobs, listed_jobs => listed_jobs.user)
  listed_jobs = new Collection<Jobs>(this);

  @Property({ type: Date })
  createdAt = new Date();

  @Property({ onUpdate: () => new Date(), type: Date })
  updatedAt = new Date();

}
