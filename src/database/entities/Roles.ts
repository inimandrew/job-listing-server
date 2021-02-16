import { Entity, PrimaryKey, Property, Unique } from '@mikro-orm/core';
@Entity()
export class Roles {
  @PrimaryKey()
  id!: number;

  @Property()
  @Unique()
  name!: string;

  @Property({ type: Date })
  createdAt = new Date();

  @Property({ onUpdate: () => new Date(), type: Date })
  updatedAt = new Date();

}
