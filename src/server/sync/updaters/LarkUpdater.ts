import bent, { RequestFunction } from 'bent';
import { Department } from '../mappers/DepartmentMapper';
import { Employee } from '../mappers/EmployeeMapper';

export type RequestFunctions = {
  get: RequestFunction<any>;
  post: RequestFunction<any>;
};
export type RequestCallback = (functions: RequestFunctions) => any;

export default class LarkUpdater {
  public appId: string;
  public appSecret: string;

  constructor(appId: string, appSecret: string) {
    this.appId = appId;
    this.appSecret = appSecret;
  }

  async withTenantAccessToken(callback: RequestCallback) {
    const { tenant_access_token } = await bent('POST', 'json')(
      'https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal/',
      {
        app_id: this.appId,
        app_secret: this.appSecret,
      },
    );

    const get = bent('GET', 'json', {
      Authorization: 'Bearer ' + tenant_access_token,
    });

    const post = bent('POST', 'json', {
      Authorization: 'Bearer ' + tenant_access_token,
    });

    return callback({
      get,
      post,
    });
  }

  department() {
    return (department: Department) =>
      this.withTenantAccessToken(async ({ get, post }) => {
        console.log('Finding department ' + department.id);

        // Check if the department already exists.
        let isCreate = true;
        let existingDepartment: any = null;

        try {
          existingDepartment = await get(
            'https://open.larksuite.com/open-apis/contact/v1/department/info/get?department_id=' +
              department.id,
          );
          
          isCreate = existingDepartment?.code === 40013;

          if (existingDepartment?.code && !isCreate) {
            console.error(existingDepartment);
            throw new Error(existingDepartment.message);
          }
        } catch (e) {
          if (e.json) {
            const json = await e.json();

            if (json.code === 40013) {
              // Not found.
            } else {
              console.error(json);
              throw new Error(json.msg);
            }
          }
        }

        try {
          if (isCreate) {
            console.log('Creating department ' + department.id);
            const { id, ...departmentFields } = department;

            await post(
              'https://open.larksuite.com/open-apis/contact/v1/department/add',
              {
                ...departmentFields,
                parent_id: department.parent_id || 0,
              },
            );
          } else {
          }
        } catch (e) {
          if (e.json) {
            const json = await e.json();
            console.error(json);
            throw new Error(json.msg);
          }
        }

        throw new Error('test');
      });
  }

  employee() {
    return (employee: Employee) =>
      this.withTenantAccessToken(async ({ get, post }) => {
        if (employee.open_id) {
          console.log('Updating employee: ' + employee.open_id);

          // Update the employee.
          const { data } = await post(
            'https://open.larksuite.com/open-apis/contact/v1/user/update',
            employee,
          );

          return data;
        }

        console.log('Creating new employee user...');
        const { data } = await post(
          'https://open.larksuite.com/open-apis/contact/v1/user/add',
          employee,
        );

        return data;
      });
  }
}
