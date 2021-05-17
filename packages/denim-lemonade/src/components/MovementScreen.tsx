import React, { FunctionComponent } from 'react';
import {
  DenimScreenV2,
  DenimApplicationButton,
  DenimApplicationField,
  DenimApplicationForm,
  DenimApplicationLayout,
  useDenimApplication,
  DenimApplicationView,
} from '../denim/application';
import { Link, useHistory } from 'react-router-dom';
import LemonadeLogo from '../assets/images/logo.jpg';
import { DenimFormControlType, DenimQueryOperator } from '../denim/core';

interface MovementScreenProps {
  id: string;
  columns: string[];
  table: string;
}

const CreateButton: FunctionComponent<{
  id: string;
}> = ({ id }) => {
  const application = useDenimApplication();

  return (
    <DenimApplicationButton
      text="Create"
      action={{
        link: `/movements/${application.record?.id}/${id}-new`,
      }}
    />
  );
};

const Screen: FunctionComponent<{ id: string }> = ({ id }) => {
  const application = useDenimApplication();
  const history = useHistory();

  return (
    <DenimApplicationLayout
      content={[
        <DenimApplicationLayout
          flowDirection="row"
          content={[
            {
              relativeWidth: 4,
              element: (
                <Link to="/">
                  <img
                    src={LemonadeLogo}
                    alt="Lemonade HR"
                    style={{ width: '180px' }}
                  />
                </Link>
              ),
            },
            {
              relativeWidth: 2,
              element: (
                <DenimApplicationField
                  schema={{
                    id: 'movements-switch',
                    type: DenimFormControlType.DropDown,
                    label: 'Movement Type',
                    controlProps: {
                      options: [
                        {
                          label: 'Job Position',
                          value: 'job-position',
                        },
                        {
                          label: 'Department',
                          value: 'department',
                        },
                        {
                          label: 'Basic Pay',
                          value: 'basic-pay',
                        },
                        {
                          label: 'Employment Status',
                          value: 'employment-status',
                        },
                        {
                          label: 'Allowance',
                          value: 'allowance',
                        },
                      ],
                    },
                  }}
                  value={id}
                  onChange={(newMovement) => {
                    history.push(
                      `/movements/${application.routeParameters?.id}/${newMovement}`,
                    );
                  }}
                />
              ),
            },
            <DenimApplicationForm
              table="201 Management"
              record={{
                conditions: {
                  conditionType: 'single',
                  field: 'Employee ID',
                  operator: DenimQueryOperator.Contains,
                  value: application.routeParameters?.id,
                },
              }}
              showSave={false}
            >
              <CreateButton id={id} />
            </DenimApplicationForm>,
          ]}
        />,
      ]}
    />
  );
};

const Actions: FunctionComponent<{
  id: string;
}> = ({ id }) => {
  const application = useDenimApplication();

  return (
    <DenimApplicationButton
      text="Edit"
      icon="pencil"
      iconOnly
      action={{
        link: `/movements/${application.record?.['Employee ID']}/${id}/${application.record?.id}`,
      }}
    />
  );
};

const View: FunctionComponent<{
  id: string;
  table: string;
  columns: string[];
}> = ({ id, table, columns }) => {
  const application = useDenimApplication();

  return (
    <DenimApplicationView
      table={table}
      columns={['Employee ID', 'Full Name', 'Effective Date', ...columns]}
      defaultSort={{
        column: 'Effective Date',
        ascending: false,
      }}
      actions={<Actions id={id} />}
      query={{
        conditionType: 'group',
        type: 'AND',
        conditions: [
          {
            conditionType: 'single',
            field: 'Employee ID',
            operator: DenimQueryOperator.Equals,
            value: application.routeParameters?.id,
          },
        ],
      }}
    />
  );
};

const Form: FunctionComponent<{
  id: string;
  table: string;
  columns: string[];
}> = ({ id, table, columns }) => {
  const application = useDenimApplication();
  const history = useHistory();

  return (
    <DenimApplicationForm
      table={table}
      prefill={{
        'User ID': {
          type: 'record',
          id: application.routeParameters?.eid,
        },
      }}
      onSave={(record) => {
        history.push(`/movements/${record?.['Employee ID']}/${id}`);
      }}
      record={application.routeParameters?.id}
    >
      <DenimApplicationLayout
        flowDirection="row"
        content={[
          <DenimApplicationField schema={{ id: 'Effective Date' }} />,
          ...columns.map((column) => (
            <DenimApplicationField
              schema={{ id: column, label: 'New ' + column }}
            />
          )),
        ]}
      />
    </DenimApplicationForm>
  );
};

const MovementScreen: FunctionComponent<MovementScreenProps> = ({
  id,
  table,
  columns,
}) => {
  return (
    <>
      <DenimScreenV2
        id={`movements-${id}`}
        paths={[`/movements/:id/${id}`]}
        allowedRoles={['hr', 'hr-user']}
      >
        <Screen id={id} />
        <View id={id} table={table} columns={columns} />
      </DenimScreenV2>
      <DenimScreenV2
        id={`movements-${id}`}
        paths={[`/movements/:eid/${id}-new`, `/movements/:eid/${id}/:id`]}
        allowedRoles={['hr', 'hr-user']}
      >
        <Form id={id} table={table} columns={columns} />
      </DenimScreenV2>
    </>
  );
};

export default MovementScreen;
