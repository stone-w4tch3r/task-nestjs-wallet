import AdminJS from 'adminjs';

export const createAdminJS = (): AdminJS => {
  return new AdminJS({
    rootPath: '/db-admin',
    resources: [],
  });
};
