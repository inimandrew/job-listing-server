import { Entity, Property, ManyToOne, Enum, PrimaryKeyType } from '@mikro-orm/core';
import { Users } from './Users';
import { Companies } from './Companies';

enum companyRoles {
  ADMIN = "admin",
  MEMBER = "member"
}

@Entity()
export class CompaniesUsers {

  @ManyToOne(() => Users,{ primary: true, type: Number })
  user!: Users;

  @ManyToOne(() => Companies,{ primary: true, type: Number })
  company!: Companies;

  [PrimaryKeyType]: [number, number];

  @Enum({ items: () => companyRoles, default: companyRoles.ADMIN })
  role!: companyRoles;

  @Property({ type: Date })
  createdAt = new Date();

  @Property({ onUpdate: () => new Date(), type: Date })
  updatedAt = new Date();

}



