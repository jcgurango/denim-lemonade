import LarkConnection from '../../LarkConnection';
import { Department } from '../mappers/DepartmentMapper';
import { Employee } from '../mappers/EmployeeMapper';

export default class LarkUpdater extends LarkConnection {
  department() {
    return (department: Department) =>
      this.withTenantAccessToken(async ({ get, post, put, token }) => {
        const departmentWithParent: Department = {
          ...department,
          parent_department_id: department.parent_department_id || '0',
        };

        // Check if the department already exists.
        let isCreate = true;
        let existingDepartment: any = null;
        existingDepartment = await get(
          'https://open.larksuite.com/open-apis/contact/v1/department/info/get?department_id=' +
            departmentWithParent.department_id,
        );

        console.log(token, JSON.stringify(departmentWithParent, null, '  '));

        isCreate = existingDepartment?.code === 40013;

        if (existingDepartment?.code && !isCreate) {
          throw new Error(existingDepartment.message);
        }

        if (isCreate) {
          console.log('Creating department ' + departmentWithParent.department_id);

          return post(
            'https://open.larksuite.com/open-apis/contact/v3/departments',
            departmentWithParent,
          );
        }

        console.log('Updating department ' + departmentWithParent.department_id);

        return put(
          'https://open.larksuite.com/open-apis/contact/v1/departments/' + departmentWithParent.department_id,
          departmentWithParent,
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

          const result = await post(
            'https://open.larksuite.com/open-apis/contact/v1/user/add',
            {
              ...employee,
              need_send_notification: true,
            },
          );

          if (result.code === 40013 && employee.email) {
            // Email already exists in the system.
            const searchResult = await get('https://open.larksuite.com/open-apis/user/v1/batch_get_id?emails=' + employee.email);
            
            if (!searchResult.code) {
              const user = searchResult.data.email_users?.[employee.email];

              if (user && user.length) {
                const { open_id } = user[0];

                return get('https://open.larksuite.com/open-apis/contact/v1/user/get?open_id=' + open_id);
              }
            } else {
              return result;
            }
          }

          return result;
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
