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
        async ({ get, post, patch }) => {
          const performUpdate = async (id: string) => {
            console.log('Updating employee: ' + id);

            const result = await patch(
              'https://open.larksuite.com/open-apis/contact/v3/users/' + id + '?user_id_type=open_id&department_id_type=department_id',
              {
                ...employee,
                open_id: id,
                department_ids: employee.department_ids?.length ? employee.department_ids : [0],
              },
            );

            return result;
          };

          if (employee.open_id) {
            // Update the employee.
            return performUpdate(employee.open_id);
          }

          console.log('Creating new employee user...');

          const result = await post(
            'https://open.larksuite.com/open-apis/contact/v3/users?department_id_type=department_id',
            {
              ...employee,
              department_ids: employee.department_ids?.length ? employee.department_ids : ['0'],
              employee_type: 1,
              need_send_notification: true,
            },
          );

          if (result.code === 21002) {
            if (employee.email) {
              // Email already exists in the system.
              const searchResult = await get('https://open.larksuite.com/open-apis/user/v1/batch_get_id?emails=' + encodeURIComponent(employee.email));
              
              if (!searchResult.code) {
                const user = searchResult.data.email_users?.[employee.email];

                if (user && user.length) {
                  const { open_id } = user[0];

                  return performUpdate(open_id);
                }
              } else {
                console.log(searchResult);
              }
            }
          }

          if (result.code === 21001) {
            if (employee.mobile) {
              // Email already exists in the system.
              const searchResult = await get('https://open.larksuite.com/open-apis/user/v1/batch_get_id?mobiles=' + encodeURIComponent(employee.mobile));

              if (!searchResult.code) {
                const user = searchResult.data.mobile_users?.[employee.mobile];

                if (user && user.length) {
                  const { open_id } = user[0];

                  return performUpdate(open_id);
                }
              }
            }
          }

          return result;
        },
        (data) => {
          if (data.user) {
            return data.user;
          }

          return data;
        },
      );
  }
}
