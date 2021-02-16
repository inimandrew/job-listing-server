import { MikroORM } from '@mikro-orm/core';
import { Users } from './entities/Users';
import { Roles } from './entities/Roles';
import { Companies } from './entities/Companies';
import { CompaniesUsers } from './entities/Companies-Users';
import { UserCv } from './entities/Users-Cv';
import { Jobs } from './entities/Jobs';
import { Applications } from './entities/Applications';
(async () => {
  const orm = await MikroORM.init({
    entities: [Roles, Users, UserCv, Companies, CompaniesUsers, Jobs, Applications],
    dbName: 'jobs',
    type: 'postgresql',
    password: 'project',
  });
  const generator = orm.getSchemaGenerator();

  const dropDump = await generator.getDropSchemaSQL();
  console.log(dropDump);

  const createDump = await generator.getCreateSchemaSQL();
  console.log(createDump);

  const updateDump = await generator.getUpdateSchemaSQL();
  console.log(updateDump);

  // there is also `generate()` method that returns drop + create queries
  const dropAndCreateDump = await generator.generate();
  console.log(dropAndCreateDump);

  // or you can run those queries directly, but be sure to check them first!
  await generator.dropSchema();
  await generator.createSchema();
  await generator.updateSchema();

  await orm.close(true);
})();
