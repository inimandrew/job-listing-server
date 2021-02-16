import express, { request, response } from 'express';
import { UsersController } from '../controllers/Users';
import { AuthController } from '../controllers/Auth';
import { Connection } from "../database/Connection"
import middleware from "./../middlewares/middleware"
const router = express.Router();
const connect = new Connection();
const UserM = new UsersController(connect);
const AuthModule = new AuthController(connect);

router.post('/auth/signup', (request, response) => {
  AuthModule.signup(request, response);
});

router.post('/auth/login', (request, response) => {
  AuthModule.login(request, response);
});

router.use(middleware.verify)

router.get('/user', (request, response) => {
  AuthModule.getUser(request, response);
});

router.put('/user/update_profile', (request, response) => {
  UserM.updateProfile(request, response);
});

router.post('/user/upload_cv', (request, response) => {
  UserM.uploadCV(request, response);
});

router.post('/company', (request, response) => {
  UserM.createCompany(request, response);
});

router.get('/companies', (request, response) => {
  UserM.getCompanies(request, response);
});

router.get('/company/:id', (request, response) => {
  UserM.getCompany(request, response);
});

router.post('/company/member', (request, response) => {
  UserM.newCompanyMember(request, response);
});

router.get('/company/members/:company', (request, response) => {
  UserM.getCompanyMembers(request, response);
});

router.get('/users', (request, response) => {
  UserM.getUsers(request, response);
});

router.get('/user/:id', (request, response) => {
  UserM.getUser(request, response);
});

router.post('/job', (request, response) => {
  UserM.newJobListing(request, response);
});

router.get('/jobs', (request, response) => {
  UserM.getJobs(request, response);
});

router.get('/job/:id', (request, response) => {
  UserM.getJob(request, response);
});

router.get('/jobs/user/:user', (request, response) => {
  UserM.getJobsByUser(request, response);
});

router.get('/jobs/company/:company', (request, response) => {
  UserM.getJobsByCompany(request, response);
});

router.post('/job/application', (request, response) => {
  UserM.jobApplication(request, response);
});

router.get('/job/applications/:job', (request, response) => {
  UserM.jobApplications(request, response);
});

router.get('/jobs/applications/user/:user', (request, response) => {
  UserM.jobApplicationByUser(request, response);
});

router.use((request, res) => {
  res.type('application/json');
  res.status(404);
  res.json({ errors: { status: ['Error 404. Endpoint not found.'] } });
});

router.use((req, res) => {
  res.type('application/json');
  res.status(500);
  res.json({ errors: { status: ['Internal Server Error'] } });
});



export default router;
