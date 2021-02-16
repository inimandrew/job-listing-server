import { Entity, PrimaryKey, Property, ManyToOne, Enum } from '@mikro-orm/core';
import { Jobs } from './Jobs';
import { UserCv } from './Users-Cv';

enum Seen {
  TRUE = "true",
  FALSE = "false"
}

@Entity()
export class Applications {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Jobs)
  job!: Jobs;

  @ManyToOne(() => UserCv)
  cv!: UserCv;

  @Property({ columnType: 'text', nullable: true })
  cover_letter!: string

  @Enum({ items: () => Seen, default: Seen.FALSE })
  is_seen!: Seen;

  @Property({ type: Date })
  createdAt = new Date();

}
