import AdminJS from 'adminjs';
import { Database, Resource } from '@adminjs/typeorm';

AdminJS.registerAdapter({ Database, Resource });

export const createAdminJS = (): AdminJS => {
  return new AdminJS({
    rootPath: '/db-admin',
    resources: [],
  });
};
