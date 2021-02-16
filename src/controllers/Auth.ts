import Validator from 'validatorjs';
import DatabaseValidator from "./DatabaseValidator"
import { Connection } from "../database/Connection"
import { Users } from "../database/entities/Users"
import bcrypt from "bcrypt"
import * as jwt from "jsonwebtoken"

export class AuthController {
  private rounds: number = 10;
  private connection: any;
  private secret: string = "feUUa56SEuHgZDS0oX832nIIn95ljqXs"

  public constructor(connection: Connection) {
    this.connection = connection
  }

  public generateToken(user: any) {
    return jwt.sign({ data: user }, this.secret, { expiresIn: '2h' });
  }

  public async signup(request: any, response: any) {
    const data = request.body;
    let rules = {
      firstname: 'required|alpha',
      lastname: 'required|alpha',
      email: 'required|email',
      phone: 'required',
      password: 'required|alpha_dash'
    };


    let validation = new Validator(data, rules);

    if (validation.fails()) {
      return response.status(422).json(validation.errors)
    } else {
      let orm = this.connection.getConnection();
      const db_validation = new DatabaseValidator(orm, 'Users', [
        {
          email: request.body.email
        },
        {
          phone: request.body.phone
        }
      ]);
      const user_exist = await db_validation.checkUnique()
      if (user_exist) {
        const errors = db_validation.getErrorMessages()
        return response.status(422).json({
          errors
        });

      } else {
        bcrypt.hash(data.password, this.rounds, async (errors, hash) => {
          if (errors) {
            return response.status(500);
          }
          const repo = orm.em.getRepository(Users);
          data.firstname = data.firstname.charAt(0).toUpperCase() + data.firstname.substr(1).toLowerCase();
          data.lastname = data.lastname.charAt(0).toUpperCase() + data.lastname.substr(1).toLowerCase()
          const newUser = repo.create({ firstname: data.firstname, lastname: data.lastname, email: data.email, phone: data.phone, password: hash, role: 3 });
          await repo.persistAndFlush(newUser).then((user: any) => {
            return response.status(201).json({ message: "User Created Successfully. You can proceed to Login!" });
          });

        })
      }

    }
  }

  public async login(request: any, response: any) {
    const data = request.body;
    let rules = {
      email: 'required|email',
      password: 'required'
    };

    let validation = new Validator(data, rules);

    if (validation.fails()) {
      return response.status(422).json(validation.errors)
    } else {
      let orm = this.connection.getConnection()
      const db_validation = new DatabaseValidator(orm, 'Users', [
        {
          email: request.body.email
        },
      ]);
      const user_does_not_exist = await db_validation.checkExist()
      if (user_does_not_exist) {
        const errors = db_validation.getErrorMessages()
        return response.status(422).json({
          errors
        });
      } else {
        const repo = orm.em.getRepository(Users);
        const user = await repo.findOne({ email: request.body.email })
        bcrypt.compare(request.body.password, user.password, (error, match) => {
          if (error) {
            return response.status(500).json({ errors: { status: ['Unexpected Error'] } });
          } else if (match) {
            const token = this.generateToken(user)
            return response.status(200).json({ loggedUser: { user: user, token: token }, message: 'User credentials Verified. You will be redirected soon.' })
          } else {
            return response.status(401).json({ errors: { password: ["Wrong Password"] } })
          }
        })
      }
    }
  }

  public getUser(request: any, response: any) {
    return response.status(200).json({ user: request.user })
  }

}
