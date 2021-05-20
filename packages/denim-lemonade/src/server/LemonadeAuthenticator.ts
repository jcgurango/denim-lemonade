import { DenimQueryOperator, DenimTable } from 'denim/core';
import { DenimAuthenticatorV2, DenimDataSourceV2 } from 'denim/service';

const LemonadeAuthenticator = (
  userTable: DenimTable,
  dataSource: DenimDataSourceV2,
) => {
  return new DenimAuthenticatorV2(
    [
      {
        id: 'hr',
        readAction: 'allow',
        createAction: 'allow',
        updateAction: 'allow',
        deleteAction: 'allow',
        tables: [],
        roleQuery: {
          conditionType: 'single',
          field: 'Is HR Admin',
          operator: DenimQueryOperator.Equals,
          value: true,
        },
      },
      {
        id: 'hr-user',
        readAction: 'allow',
        createAction: 'block',
        updateAction: 'block',
        deleteAction: 'block',
        tables: [],
        roleQuery: {
          conditionType: 'single',
          field: 'Is HR User',
          operator: DenimQueryOperator.Equals,
          value: true,
        },
      },
      {
        id: 'employee',
        readAction: 'block',
        createAction: 'block',
        updateAction: 'block',
        deleteAction: 'block',
        tables: [
          {
            table: 'Employee',
            createAction: 'block',
            readAction: {
              conditionType: 'group',
              type: 'OR',
              conditions: [
                {
                  conditionType: 'single',
                  field: 'id',
                  operator: DenimQueryOperator.Equals,
                  value: {
                    $user: 'id',
                  },
                },
                {
                  conditionType: 'single',
                  field: 'id',
                  operator: DenimQueryOperator.Equals,
                  value: {
                    $user: 'Direct Manager',
                  },
                },
              ],
            },
            updateAction: {
              conditionType: 'single',
              field: 'id',
              operator: DenimQueryOperator.Equals,
              value: {
                $user: 'id',
              },
              allowedFields: ['First Name', 'Last Name', 'Email'],
            },
          },
          {
            table: 'Leave Scheme',
            createAction: 'block',
            readAction: 'allow',
            updateAction: 'block',
          },
          {
            table: 'Department',
            createAction: 'block',
            readAction: 'allow',
            updateAction: 'block',
          },
          {
            table: 'Job Title',
            createAction: 'block',
            readAction: 'allow',
            updateAction: 'block',
          },
          {
            table: 'Job Roles',
            createAction: 'block',
            readAction: 'allow',
            updateAction: 'block',
          },
          {
            table: 'Job Positions',
            createAction: 'block',
            readAction: 'allow',
            updateAction: 'block',
          },
          {
            table: 'Employee Allowance',
            createAction: 'block',
            readAction: 'allow',
            updateAction: 'block',
          },
        ],
        roleQuery: {
          conditionType: 'group',
          type: 'AND',
          conditions: [
            {
              conditionType: 'single',
              field: 'Is HR Admin',
              operator: DenimQueryOperator.DoesNotEqual,
              value: true,
            },
            {
              conditionType: 'single',
              field: 'Is HR User',
              operator: DenimQueryOperator.DoesNotEqual,
              value: true,
            },
            {
              conditionType: 'single',
              field: 'id',
              operator: DenimQueryOperator.NotNull,
              value: true,
            },
          ],
        },
      },
    ],
    userTable,
    dataSource,
  );
};

export default LemonadeAuthenticator;
