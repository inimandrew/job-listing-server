import { Connection } from "../database/Connection";

class DatabaseValidator {
  private table: string;
  private columnValue: any;
  private connection: Connection;
  private errors: any = {};

  constructor(connection: Connection, table: string, columnValue: any) {
    this.table = table;
    this.columnValue = columnValue;
    this.connection = connection;
  }

  public async checkUnique() {
    var response = false;
    const repo = this.connection.em.getRepository(this.table);
    const exist = await repo.find({
      $or: this.columnValue
    });
    if (exist.length) {
      const keys = this.getKeys()
      const values = this.getValues()
      exist.forEach((element: any) => {
        keys.forEach((index: any) => {
          if (values.includes(element[index])) {
            this.errors[index] = ["This " + index + " has been taken"]
          }
        });
      });
      response = true
    }
    return response;
  }

  public async checkExist() {
    var response = false;
    const repo = this.connection.em.getRepository(this.table);
    const exist = await repo.find({
      $or: this.columnValue
    });
    if (!exist.length) {
      const keys = this.getKeys()
      keys.forEach((index: any) => {
        this.errors[index] = ["This " + index + " is invalid"]
      });
      response = true
    }
    return response;
  }

  public getErrorMessages() {
    return this.errors;
  }

  public getKeys() {
    var keys: any = [];
    this.columnValue.forEach((element: any) => {
      keys.push(Object.keys(element)[0])
    });
    return keys;
  }

  public getValues() {
    var values: any = [];
    this.columnValue.forEach((element: any) => {
      values.push(Object.values(element)[0])
    });
    return values;
  }
}

export default DatabaseValidator

