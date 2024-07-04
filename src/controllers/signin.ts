import { AuthModel } from '@auth/models/auth.schema';
import { loginSchema } from '@auth/schemes/signin';
import { getUserByUsername } from '@auth/services/auth.service';
import { signToken } from '@auth/services/auth.service';
import { getUserByEmail } from '@auth/services/auth.service';
import { BadRequestError, IAuthDocument, isEmail } from '@harshbhama/jobber-shared';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { omit } from 'lodash';

export async function read(req: Request, res: Response): Promise<void>{
  const { error } = await Promise.resolve(loginSchema.validate(req.body));
  if(error?.details){
    throw new BadRequestError(error.details[0].message, 'Signin read() method error');
  }
  const { username, password } = req.body;
  const isValidEmail: boolean = isEmail(username);
  let exisitingUser: IAuthDocument;
  if(!isValidEmail){
    exisitingUser = await getUserByUsername(username);
  }else{
    exisitingUser = await getUserByEmail(username);
  }
  if(!exisitingUser){
    throw new BadRequestError('Invalid credentionals', 'SignIn read() method error');
  }
  const passwordsMatch: boolean = await AuthModel.prototype.comparePassword(password, exisitingUser.password!);
  if(!passwordsMatch){
    throw new BadRequestError('Invalid credentials', 'SignIn read()')
  }
  const userJWT: string = signToken(exisitingUser.id!, exisitingUser.email!, exisitingUser.username!);
  const userData: IAuthDocument = omit(exisitingUser, ['password']);
  res.status(StatusCodes.OK).json({message: 'User loggged in successfully', user: userData, token: userJWT});

}