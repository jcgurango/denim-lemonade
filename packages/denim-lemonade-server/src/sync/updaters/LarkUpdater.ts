import LarkConnection from '../../LarkConnection';
import { Department } from '../mappers/DepartmentMapper';
import { Employee } from '../mappers/EmployeeMapper';

export default class LarkUpdater extends LarkConnection {
  department() {
    return (department: Department) =>
      this.withTenantAccessToken(async ({ get, post }) => {
        // Check if the department already exists.
        let isCreate = !department.id;

        if (isCreate) {
          console.log('Creating department ' + department.name);

          return post(
            'https://open.larksuite.com/open-apis/contact/v1/department/add',
            {
              ...department,
              parent_id: department.parent_id || 0,
            },
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

          const result = await post(
            'https://open.larksuite.com/open-apis/contact/v1/user/add',
            {
              ...employee,
              need_send_notification: true,
            },
          );

          if (result.code === 40013) {
            if (employee.email) {
              // Email already exists in the system.
              const searchResult = await get('https://open.larksuite.com/open-apis/user/v1/batch_get_id?emails=' + employee.email);
              
              if (!searchResult.code) {
                const user = searchResult.data.email_users?.[employee.email];

                if (user && user.length) {
                  const { open_id } = user[0];

                  return get('https://open.larksuite.com/open-apis/contact/v1/user/get?open_id=' + open_id);
                }
              }
            }

            if (employee.mobile) {
              // Email already exists in the system.
              const searchResult = await get('https://open.larksuite.com/open-apis/user/v1/batch_get_id?mobiles=' + encodeURIComponent(employee.mobile));
              
              if (!searchResult.code) {
                const user = searchResult.data.mobile_users?.[employee.mobile];

                if (user && user.length) {
                  const { open_id } = user[0];

                  return get('https://open.larksuite.com/open-apis/contact/v1/user/get?open_id=' + open_id);
                }
              }
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
