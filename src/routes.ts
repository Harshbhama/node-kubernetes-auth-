import { Application } from "express";
import { authRoutes } from "@auth/routes/auth";
import { currentUserRoutes } from "@auth/routes/current-user";
import { healthRoutes } from "@auth/routes/health";
// import { verifyGatewayRequest } from "@harshbhama/jobber-shared";

const BASE_PATH = '/api/v1/auth';

export function appRoutes(app: Application): void {
  // app.use(BASE_PATH, verifyGatewayRequest ,authRoutes());
  app.use('', healthRoutes());
  app.use(BASE_PATH ,authRoutes());
  app.use(BASE_PATH ,currentUserRoutes());
}
