import React, { useState } from 'react';
import { FunctionComponent } from 'react';
import {
  DenimApplicationButton,
  DenimApplicationFilter,
  DenimApplicationLayout,
  DenimApplicationView,
  useDenimApplication,
} from '../denim/application';
import LemonadeLogo from '../assets/images/logo.jpg';
import { DenimQueryConditionGroup } from '../denim/core';

const Actions = () => {
  const application = useDenimApplication();

  return (
    <>
      <DenimApplicationButton
        text="View Employee Movements"
        action={{ link: `/movements/${application.record?.['Employee ID']}/job-position` }}
        iconOnly
        icon="list"
      />
      <DenimApplicationButton
        text="View"
        action={{ link: `/employee/${application.record?.id}` }}
        iconOnly
        icon="pencil"
      />
      <DenimApplicationButton
        text="Delete"
        action="deleteRecord"
        iconOnly
        icon="delete"
      />
    </>
  );
};

const EmployeeList: FunctionComponent<{}> = () => {
  const [query, setQuery] = useState<DenimQueryConditionGroup | undefined>();

  return (
    <DenimApplicationLayout
      content={[
        <DenimApplicationLayout
          flowDirection="row"
          content={[
            {
              relativeWidth: 2,
              element: (
                <img
                  src={LemonadeLogo}
                  alt="Lemonade HR"
                  style={{ width: '180px' }}
                />
              ),
            },
            {
              relativeWidth: 3,
              element: (
                <DenimApplicationFilter
                  table="Employee"
                  columns={[
                    'Employee ID',
                    'Last Name',
                    'First Name',
                    'Payroll ID',
                  ]}
                  globalSearchColumns={[
                    'Employee ID',
                    'Last Name',
                    'First Name',
                    'Job Title',
                  ]}
                  value={query}
                  onChange={setQuery}
                />
              ),
            },
            <DenimApplicationButton
              text="Create"
              action={{
                link: '/employee',
              }}
            />,
          ]}
        />,
        <DenimApplicationView
          table="Employee"
          columns={[
            'Employee ID',
            'Last Name',
            'First Name',
            'Full Name',
            'Account Status',
            'Job Title',
          ]}
          query={query}
          actions={<Actions />}
        />,
      ]}
    />
  );
};

export default EmployeeList;
