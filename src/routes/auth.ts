import { read } from '@auth/controllers/signin';
import { create } from '@auth/controllers/signup';
import express, { Router } from 'express';
import { update } from '@auth/controllers/verify-email';
import { changePassword, forgotPassword, resetPassword } from '@auth/controllers/password';

const router: Router = express.Router();

export function authRoutes(): Router {
  router.post('/signup', create);
  router.post('/signin', read);
  router.put('/verify-email', update);
  router.put('/forgot-password', forgotPassword);
  router.put('/reset-password/:token', resetPassword);
  router.put('/change-password', changePassword);

  return router;
}

