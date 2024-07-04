import { signupSchema } from "@auth/schemes/signup";
import { createAuthUser, getUserByUsernameOrEmail, signToken } from "@auth/services/auth.service";
import { BadRequestError, IAuthDocument, IEmailMessageDetails, firstLetterUppercase,
  
  //uploads 

} from "@harshbhama/jobber-shared";
import { UploadApiResponse, UploadApiErrorResponse } from "cloudinary";
import { Request, Response } from "express";
import { v4 as uuidV4 } from 'uuid';
import crypto from 'crypto';
// import { lowerCase } from "lodash";
import { config } from "@auth/config";
import { publishDirectMessage } from "@auth/queues/auth.producer";
import { authChannel } from "@auth/server";
import { StatusCodes } from "http-status-codes";
import cloudinary from 'cloudinary';

export function uploadsMethod(
  file: string,
  public_id?: string,
  overwrite?: boolean,
  invalidate?: boolean
): Promise< UploadApiErrorResponse | UploadApiResponse | undefined> {
  return new Promise((resolve) => {
    cloudinary.v2.uploader.upload(
      file,
      {
        public_id,
        overwrite,
        invalidate,
        resource_type: 'auto', // zip images
      },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error) 
        resolve(error);
        resolve(result);
      }
    );
  });
}


export async function create(req: Request, res: Response): Promise<void> {
  const { error } = await Promise.resolve(signupSchema.validate(req.body));
  if(error?.details){
    throw new BadRequestError(error.details[0].message, 'SignUp create() method error');
  }
  const { username, email, password, country, profilePicture} = req.body;
  const checkIfUserExist: IAuthDocument = await getUserByUsernameOrEmail(username, email);
  if(checkIfUserExist){
    throw new BadRequestError('Invalid crendentials. Email or Username', 'Sign create() method error');
  }

  const profilePublicId = uuidV4();
  const uploadResult: UploadApiResponse = await uploadsMethod(profilePicture, `${profilePublicId}`, true, true) as UploadApiResponse;
  if (!uploadResult.public_id) {
    throw new BadRequestError('File upload error. Try again', 'Sign create() method error'); 
  }
  const randonBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
  const randomCharacters: string = randonBytes.toString('hex');
  const authData: IAuthDocument = {
    username: firstLetterUppercase(username),
    email: email,
    profilePublicId: profilePublicId,
    password,
    country,
    profilePicture: uploadResult?.secure_url,
    emailVerificationToken: randomCharacters,
  } as IAuthDocument;
  const result: IAuthDocument = await createAuthUser(authData);
  const verificationLink = `${config.CLIENT_URL}/confirm_email?v_token=${authData?.emailVerificationToken}`
  const messageDetails: IEmailMessageDetails = {
    receiverEmail: result.email,
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
  const userJWT: string = signToken(result.id!, result.email!, result.username!);
  res.status(StatusCodes.CREATED).json({message: 'User created successfully', user: result, token: userJWT});
}