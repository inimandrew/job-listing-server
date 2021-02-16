import { MikroORM } from '@mikro-orm/core';
import { Roles } from '../entities/Roles';

(async () => {
  const orm = await MikroORM.init({
    entities: [Roles],
    dbName: 'jobs',
    type: 'postgresql',
    password: 'project',
  });
  const seeds = ['Super Administrator', 'Recruiters', 'Normal User'];
  var rolesData: any = [];
  const repo = orm.em.getRepository(Roles);
  seeds.forEach(element => {
    rolesData.push(repo.create({ name: element }));
  });
  await repo.persistAndFlush(rolesData);

  await orm.close(true);
})();
