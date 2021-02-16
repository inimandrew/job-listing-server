import { MikroORM, RequestContext } from '@mikro-orm/core';
import { Users } from "./entities/Users";
import { Roles } from './entities/Roles';
import { Companies } from './entities/Companies';
import { CompaniesUsers } from './entities/Companies-Users';
import { UserCv } from './entities/Users-Cv';
import { Jobs } from './entities/Jobs';
import { Applications } from './entities/Applications';

class Connection {
  private connection: any;
  em: any;
  public constructor() {
    Promise.all([this.startConnection()]).then(response => {
      console.log('Database Connection Established');
    }).catch(error => {
      console.log("Database Connection not Established");
    })
  }
  async startConnection() {
    const orm = await MikroORM.init({
      entities: [Roles, Users, UserCv, Companies, CompaniesUsers, Jobs, Applications],
      dbName: 'jobs',
      type: 'postgresql',
      password: 'project',
    });
    this.connection = orm;
    return true;
  }

  public getConnection() {
    this.connection.em.clear();
    return this.connection;
  }
}
export { Connection }



