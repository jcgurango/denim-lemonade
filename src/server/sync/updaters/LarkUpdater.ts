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

  async withTenantAccessToken(callback: RequestCallback, mapResponseData?: (responseData: any) => any) {
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

    const result = await callback({
      get,
      post,
    });

    if (result) {
      if (result.code) {
        console.error(result);
        throw new Error(result.msg);
      }

      return mapResponseData ? mapResponseData(result.data) : result.data;
    }
  }

  department() {
    return (department: Department) =>
      this.withTenantAccessToken(async ({ get, post }) => {
        // Check if the department already exists.
        let isCreate = true;
        let existingDepartment: any = null;
        existingDepartment = await get(
          'https://open.larksuite.com/open-apis/contact/v1/department/info/get?department_id=' +
            department.id,
        );

        isCreate = existingDepartment?.code === 40013;

        if (existingDepartment?.code && !isCreate) {
          throw new Error(existingDepartment.message);
        }

        if (isCreate) {
          console.log('Creating department ' + department.id);

          return post(
            'https://open.larksuite.com/open-apis/contact/v1/department/add',
            department,
          );
        }

        console.log('Updating department ' + department.id);

        return post(
          'https://open.larksuite.com/open-apis/contact/v1/department/update',
          department,
        );
      });
  }

  employee() {
    return (employee: Employee) =>
      this.withTenantAccessToken(async ({ get, post }) => {
        if (employee.open_id) {
          console.log('Updating employee: ' + employee.open_id);

          // Update the employee.
          return post(
            'https://open.larksuite.com/open-apis/contact/v1/user/update',
            employee,
          );
        }

        console.log('Creating new employee user...');

        return post(
          'https://open.larksuite.com/open-apis/contact/v1/user/add',
          employee,
        );
      }, (data) => {
        if (data.user_info) {
          return data.user_info;
        }

        return data;
      });
  }
}
