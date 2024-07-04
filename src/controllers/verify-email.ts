import { getAuthUserById, getAuthUserByVerificationToken, updateVerifyEmailField } from "@auth/services/auth.service";
import { BadRequestError, IAuthDocument } from "@harshbhama/jobber-shared";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

export async function update(req: Request, res: Response): Promise<void> {
  const { token } = req.body;
  const checkIfUserExist: IAuthDocument = await getAuthUserByVerificationToken(token);
  if(!checkIfUserExist) {
    throw new BadRequestError('Varification token is either invalid or already used','VerifyEmailupdate() method error');
  }
  await updateVerifyEmailField(checkIfUserExist.id!, 1, '');
  const updatedUser = await getAuthUserById(checkIfUserExist.id!);
  res.status(StatusCodes.OK).json({message: 'Email verified successfully', user: updatedUser})
}
