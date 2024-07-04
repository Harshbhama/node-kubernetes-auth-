import { config } from "@auth/config";
import { publishDirectMessage } from "@auth/queues/auth.producer";
import { authChannel } from "@auth/server";
import { getAuthUserById, getUserByEmail, updateVerifyEmailField } from "@auth/services/auth.service";
import { BadRequestError, IAuthDocument, IEmailMessageDetails, lowerCase } from "@harshbhama/jobber-shared";
import crypto from 'crypto';
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

export async function read(req: Request, res: Response): Promise<void> {
  let user = null;
  const exisitingUser: IAuthDocument = await getAuthUserById(req.currentUser!.id);
  if(Object.keys(exisitingUser).length){
    user = exisitingUser;
  }
  res.status(StatusCodes.OK).json({ message: 'Authenticated user', user});
}

export async function resendEmail(req: Request, res: Response): Promise<void> {
  const { email, userId } = req.body;
  const checkIfUserExist: IAuthDocument = await getUserByEmail(lowerCase(email));
  if(!checkIfUserExist){
    throw new BadRequestError('Email is invalid', 'CurrentUser resendEmail() method error');
  }
  const randonBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
  const randomCharacters: string = randonBytes.toString('hex');
  const verificationLink = `${config.CLIENT_URL}/confirm_email?v_token=${randomCharacters}`
  await updateVerifyEmailField(parseInt(userId), 0, randomCharacters);
  const messageDetails: IEmailMessageDetails = {
    receiverEmail: lowerCase(email),
    verifyLink: verificationLink,
    template: 'verifyEmail'
  };
  await publishDirectMessage(
    authChannel, 
    'jobber-email-notification',
    'auth-email',
    JSON.stringify(messageDetails),
    'Verify Email message has been sent to notification service'
  );
  const updatedUser = await getAuthUserById(parseInt(userId));
  res.status(StatusCodes.CREATED).json({message: 'Email verification sent', user: updatedUser});
}
