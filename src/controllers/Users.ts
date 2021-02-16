import Validator from 'validatorjs';
import DatabaseValidator from "./DatabaseValidator"
import { Connection } from "../database/Connection"
import { Users } from "../database/entities/Users"
import { Companies } from '../database/entities/Companies';
import { CompaniesUsers } from '../database/entities/Companies-Users';
import { Jobs } from '../database/entities/Jobs';
import bcrypt from "bcrypt"
import formidable from "formidable"
import fs from 'fs';
import { AuthController } from './Auth';
import { UserCv } from '../database/entities/Users-Cv';
import { Applications } from '../database/entities/Applications';

export class UsersController {
  private connection: any;
  private rounds: number = 10;
  public constructor(connection: Connection) {
    this.connection = connection
  }

  public updateProfile(request: any, response: any) {
    const form = new formidable.IncomingForm();

    form.parse(request, async (err: any, data: any, files: any) => {
      if (err) {

        return response.status(400).json({
          errors: {
            error: ['An Error Occured']
          }
        });
      }
      let rules = {
        firstname: 'required|alpha',
        lastname: 'required|alpha',
        phone: 'required',
        password: 'string|confirmed',
        password_confirmation: 'required_with:password',
      };


      let validation = new Validator(data, rules);

      if (validation.fails()) {
        return response.status(422).json(validation.errors)
      } else {
        let orm = this.connection.getConnection();
        const phone_exist = await orm.em.findOne(Users, { phone: data.phone });
        if ((phone_exist == null) || (phone_exist.id == request.user.id)) {
          const user = await orm.em.findOne(Users, { id: request.user.id });
          user.firstname = data.firstname;
          user.lastname = data.lastname;
          user.phone = data.phone;
          if (data.password) {
            bcrypt.hash(data.password, this.rounds, async (errors, hash) => {
              if (errors) {
                return response.status(400);
              }
              user.password = hash
            })
          }
          if (files.profile_image) {
            const allowed_types = ['image/jpeg', 'image/png', 'image/jpg'];
            const file = files.profile_image;
            const mime_type = file.type;
            if (allowed_types.includes(mime_type)) {
              const extension = file.name.substring(file.name.lastIndexOf('.') + 1)
              const dir = process.cwd() + '/src';
              const photo_dir = '/uploads/profile_images/'
              const image_path = Date.now() + '.' + extension
              const upload_dir = dir + photo_dir
              const final_path = upload_dir + image_path
              fs.existsSync(upload_dir) || fs.mkdirSync(upload_dir)
              fs.copyFileSync(file.path, final_path)
              user.image_path = image_path;
            } else {
              return response.status(422).json({
                errors: {
                  profile_image: ['Invalid File type. Only jpg, png and jpeg files allowed.']
                }
              });
            }
          }
          await orm.em.persistAndFlush(user).then((res: any) => {
            const auth = new AuthController(this.connection)
            const token = auth.generateToken(user);
            return response.status(200).json({ message: "Profile data updated", user: user, token: token });
          })
        } else {
          return response.status(422).json({
            errors: {
              phone: ['Phone has been taken']
            }
          });
        }
      }
    });
  }

  public uploadCV(request: any, response: any) {
    const form = new formidable.IncomingForm();

    form.parse(request, async (err: any, data: any, files: any) => {
      if (err) {
        return response.status(400).json({
          errors: {
            error: ['An Error Occured']
          }
        });
      }
      let orm = this.connection.getConnection();
      var user = await orm.em.findOne(Users, { id: request.user.id });
      var uploaded_cv = await user.cv.loadCount()
      if (files.cv) {
        const allowed_types = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
        const file = files.cv;
        const mime_type = file.type;
        if (allowed_types.includes(mime_type)) {
          const extension = file.name.substring(file.name.lastIndexOf('.') + 1)
          const dir = process.cwd() + '/src';
          const photo_dir = '/uploads/cv/'
          const cv_path = Date.now() + '.' + extension
          const upload_dir = dir + photo_dir
          const final_path = upload_dir + cv_path
          fs.existsSync(upload_dir) || fs.mkdirSync(upload_dir)
          fs.copyFileSync(file.path, final_path)
          const repo = orm.em.getRepository(UserCv)
          const cv_entry = repo.create({
            user: user.id,
            file_path: cv_path,
            status: uploaded_cv > 0 ? 'false' : 'true',
            file_name: file.name
          })
          await repo.persistAndFlush(cv_entry).then((res: any) => {
            return response.status(201).json({ message: "CV uploaded successfully." });
          })
        } else {
          return response.status(422).json({
            errors: {
              cv: ['Invalid File type. Only doc, docx and pdf files allowed.']
            }
          });
        }
      } else {
        return response.status(422).json({
          errors: {
            cv: ['CV File required']
          }
        });
      }

    });
  }

  public async createCompany(request: any, response: any) {
    const data = request.body;
    let rules = {
      name: 'required|string',
      address: 'required|string',
      email: 'required|email',
      phone: 'required',
    };


    let validation = new Validator(data, rules);

    if (validation.fails()) {
      return response.status(422).json(validation.errors)
    } else {
      let orm = this.connection.getConnection();
      const db_validation = new DatabaseValidator(orm, 'Companies', [
        {
          email: request.body.email
        },
        {
          name: request.body.name
        },
        {
          phone: request.body.phone
        }
      ]);
      const company_exist = await db_validation.checkUnique()
      if (company_exist) {
        const errors = db_validation.getErrorMessages()
        return response.status(422).json({
          errors
        });

      } else {
        const repo = orm.em.getRepository(Companies);
        const newCompany = repo.create({ name: data.name, email: data.email, phone: data.phone, address: data.address });
        await repo.persistAndFlush(newCompany).then(async (company: any) => {
          const related = orm.em.getRepository(CompaniesUsers);
          const newCompanyUser = related.create({ company: newCompany.id, user: request.user.id });
          await related.persistAndFlush(newCompanyUser).then((user: any) => {
            return response.status(201).json({ message: "Company Created Successfully." });
          })
        });

      }
    }
  }

  public async getCompanies(request: any, response: any) {
    let orm = this.connection.getConnection()
    const repo = orm.em.getRepository(Companies);
    await repo.findAll({
      populate: ['members', 'members.user']
    }).then((resp: any) => {
      return response.status(200).json({ data: resp });
    })
  }

  public async getCompany(request: any, response: any) {
    try {
      let id = request.params.id;
      let orm = this.connection.getConnection();
      await orm.em.findOneOrFail(Companies, { id: id }).then((res: any) => {
        return response.status(200).json({ data: res });
      })
    } catch (error) {
      return response.status(404).json({
        company: ['Invalid Company']
      });
    }

  }

  public async newCompanyMember(request: any, response: any) {
    const data = request.body;
    let rules = {
      company: 'required|numeric',
      user: 'required|numeric',
      role: 'required|alpha'
    };

    let validation = new Validator(data, rules);

    if (validation.fails()) {
      return response.status(422).json(validation.errors)
    } else {
      var errors: any = {};
      let orm = this.connection.getConnection();
      var user = await orm.em.count(Users, { id: request.body.user });
      var company = await orm.em.count(Companies, { id: request.body.company });
      if (user == 0) {
        errors['user'] = ['This user is invalid'];
      }
      if (company == 0) {
        errors['company'] = ['This company is invalid'];
      }

      if ((user == 0) || (company == 0)) {
        return response.status(422).json({
          errors: errors
        });
      } else {
        const repo = orm.em.getRepository(CompaniesUsers);
        const isMemberAlready = await repo.count({
          $and: [
            {
              user: request.body.user
            },
            {
              company: request.body.company
            }
          ]
        });

        if (isMemberAlready > 0) {
          return response.status(400).json({
            errors: {
              user: ["This user is already a member of the company."]
            }
          });
        } else {
          const newMember = repo.create({ user: request.body.user, company: request.body.company, role: request.body.role });
          await repo.persistAndFlush(newMember).then((resp: any) => {
            return response.status(201).json({ message: "New member added Successfully." });
          })
        }
      }
    }
  }

  public async getCompanyMembers(request: any, response: any) {
    let orm = this.connection.getConnection()
    const repo = orm.em.getRepository(Companies);
    await repo.find({ id: request.params.company }, {
      populate: ['members', 'members.user']
    }).then((resp: any) => {
      return response.status(200).json({ data: resp });
    })
  }

  public async getUsers(request: any, response: any) {
    let orm = this.connection.getConnection()
    const repo = orm.em.getRepository(Users);
    await repo.findAll().then((resp: any) => {
      return response.status(200).json({ data: resp });
    })
  }

  public async getUser(request: any, response: any) {
    try {
      let id = request.params.id;
      let orm = this.connection.getConnection();
      await orm.em.findOneOrFail(Users, { id: id }).then((res: any) => {
        return response.status(200).json({ data: res });
      })
    } catch (error) {
      return response.status(404).json({
        user: ['Invalid User']
      });
    }
  }

  public async newJobListing(request: any, response: any) {
    const data = request.body;
    let rules = {
      title: 'required|string',
      description: 'required|string',
      company: 'numeric'
    };
    let validation = new Validator(data, rules);

    if (validation.fails()) {
      return response.status(422).json(validation.errors)
    } else {

      let orm = this.connection.getConnection();
      const errors: any = {};
      var user, company;
      user = await orm.em.count(Users, { id: request.user.id });

      if (request.body.company) {
        company = await orm.em.count(Companies, { id: request.body.company });
        if (company == 0) {
          errors['company'] = ['This company is invalid'];
        }
      }
      if (user == 0) {
        errors['user'] = ['This user is invalid'];
      }

      if ((user == 0) || (company == 0)) {
        return response.status(422).json({ errors: errors });
      } else {
        let job = {
          user: request.user.id,
          title: request.body.title,
          description: request.body.description,
          company: request.body.company ? request.body.company : null
        }
        let repo = orm.em.getRepository(Jobs);
        const newJob = repo.create(job);
        await repo.persistAndFlush(newJob).then((res: any) => {
          return response.status(201).json({ message: "Job Listing added Successfully." });
        })
      }

    }
  }

  public async getJobs(request: any, response: any) {
    let orm = this.connection.getConnection()

    let repo = orm.em.getRepository(Jobs);
    await repo.findAll({
      populate: ['user', 'company']
    }).then((res: any) => {
      return response.status(200).json({ data: res })
    });
  }

  public async getJob(request: any, response: any) {
    try {
      let id = request.params.id;
      let orm = this.connection.getConnection();
      await orm.em.findOneOrFail(Jobs, { id: id }).then((res: any) => {
        return response.status(200).json({ data: res });
      })
    } catch (error) {
      return response.status(404).json({
        job: ['Invalid Job']
      });
    }
  }

  public async getJobsByUser(request: any, response: any) {
    try {
      let orm = this.connection.getConnection()
      let user = request.params.user;

      let user_check = await orm.em.findOneOrFail(Users, { id: user });
      await user_check.listed_jobs.init({ populate: ['company'] }).then((res: any) => {
        return response.status(200).json({ data: res })
      });

    } catch (error) {
      return response.status(404).json({
        errors: {
          status: ['User is Invalid']
        }
      })
    }
  }

  public async getJobsByCompany(request: any, response: any) {
    try {
      let orm = this.connection.getConnection()
      let company = Number(request.params.company);
      let company_check = await orm.em.findOneOrFail(Companies, { id: company });

      await company_check.listed_jobs.init().then((res: any) => {
        return response.status(200).json({ data: res })
      });
    } catch (error) {
      return response.status(404).json({
        errors: {
          status: ['Company is Invalid']
        }
      })
    }



  }

  public async jobApplication(request: any, response: any) {
    const data = request.body;
    let rules = {
      job: 'required|numeric',
      cv: 'numeric',
      cover_letter: 'string'
    };
    let validation = new Validator(data, rules);

    if (validation.fails()) {
      return response.status(422).json(validation.errors)
    } else {
      let orm = this.connection.getConnection();
      let job = await orm.em.findOne(Jobs, { id: data.job }, { populate: ['user'] });

      if (job === null) {
        return response.status(404).json({
          errors: {
            job: ['Invalid Job']
          }
        });
      } else if (job.user.id == request.user.id) {
        return response.status(422).json({
          errors: {
            job: ['Action not allowed. You cannot apply to a job listing uploaded by your account']
          }
        });
      }
      if (data.cv) {
        let cv_check = await orm.em.findOne(UserCv, { user: request.user.id, id: data.cv });
        if (!cv_check) {
          return response.status(422).json({
            errors: {
              cv: ['Invalid CV']
            }
          });
        }
      } else {
        let default_cv = await orm.em.findOne(UserCv, { user: request.user.id, status: 'true' });
        if (default_cv) {
          data['cv'] = default_cv.id
        } else {
          return response.status(422).json({
            errors: {
              cv: ['User has no default CV']
            }
          })
        }
      }
      const repo = orm.em.getRepository(Applications);
      let application = await repo.findOne(data);
      if (application) {
        return response.status(422).json({
          errors: {
            cv: ['You already applied for this job']
          }
        })
      } else {
        const newApplication = repo.create({ job: data.job, cv: data.cv, cover_letter: data.cover_letter ? data.cover_letter : null });
        await repo.persistAndFlush(newApplication).then((res: any) => {
          return response.status(201).json({
            message: "Job Application successful."
          })
        })
      }
    }
  }

  public async jobApplications(request: any, response: any) {
    try {
      let job = request.params.job;
      let orm = this.connection.getConnection();
      const repo = orm.em.getRepository(Jobs);
      const listedJob = await repo.findOneOrFail({ id: job });

      await listedJob.job_applications.init({ populate: ['cv', 'cv.user'] }).then((res: any) => {
        return response.status(200).json({ data: res });
      })

    } catch (error) {
      return response.status(404).json({
        message: "Invalid Job Id."
      });
    }
  }

  public async jobApplicationByUser(request: any, response: any) {
    try {
      let user = request.params.user;
      let orm = this.connection.getConnection();
      const repo = orm.em.getRepository(UserCv);
      let cv = await repo.findOneOrFail({ user: user });
      await cv.job_applications.init({ populate: ['job', 'job.company', 'cv'] }).then((res: any) => {
        return response.status(200).json({ data: res })
      })

    } catch (error) {
      return response.status(404).json({
        errors: {
          user: ['Invalid User']
        }
      })
    }
  }
}
