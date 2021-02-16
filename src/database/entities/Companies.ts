import { Entity, PrimaryKey, Property, Unique, Enum, OneToMany, Collection } from '@mikro-orm/core';
import { CompaniesUsers } from './Companies-Users';
import { Jobs } from './Jobs';

enum companyStatus {
  DISABLED = "disabled",
  ACTIVE = "active",
  SUSPENDED = "suspended"
}

enum Verified {
  TRUE = "1",
  FALSE = "2"
}
@Entity()
export class Companies {
  @PrimaryKey()
  id!: number;

  @Property()
  @Unique()
  name!: string;

  @Property()
  address!: string;

  @Property()
  @Unique()
  phone!: string;

  @Property()
  @Unique()
  email!: string;

  @Enum({ items: () => companyStatus, default: companyStatus.DISABLED})
  status!: companyStatus;

  @Enum({ items: () => Verified, default: Verified.FALSE })
  verified!: Verified;

  @OneToMany(() => CompaniesUsers, company_members => company_members.company)
  members = new Collection<CompaniesUsers>(this);

  @OneToMany(() => Jobs, listed_jobs => listed_jobs.company)
  listed_jobs = new Collection<Jobs>(this);

  @Property({ type: Date })
  createdAt = new Date();

  @Property({ onUpdate: () => new Date(), type: Date })
  updatedAt = new Date();

}
