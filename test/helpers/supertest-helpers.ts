import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import type { Server } from 'http';

export function req(app: INestApplication): request.SuperTest<request.Test> {
  return request(app.getHttpServer() as unknown as Server);
}

export function bodyAs<T>(res: request.Response): T {
  return res.body as T;
}
