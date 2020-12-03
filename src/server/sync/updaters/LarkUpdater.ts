import LarkConnection from '../../LarkConnection';
import { Department } from '../mappers/DepartmentMapper';
import { Employee } from '../mappers/EmployeeMapper';

export default class LarkUpdater extends LarkConnection {
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
      this.withTenantAccessToken(
        async ({ get, post }) => {
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
        },
        (data) => {
          if (data.user_info) {
            return data.user_info;
          }

          return data;
        },
      );
  }
}
