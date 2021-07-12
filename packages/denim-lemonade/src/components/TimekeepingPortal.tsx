import React, { useState } from 'react';
import { FunctionComponent } from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import {
  DenimFormControlType,
  DenimNotificationCodes,
  DenimRelatedRecord,
  DenimRelatedRecordCollection,
  DenimWorkflowContext,
} from 'denim';
import {
  DenimApplicationButton,
  DenimApplicationField,
  DenimApplicationLayout,
  useDenimApplication,
  useDenimNotifications,
} from 'denim-forms';
import LemonadeLogo from '../assets/images/logo.jpg';
import { ActivityIndicator } from 'react-native';

const TimekeepingPortal: FunctionComponent<{}> = () => {
  const application = useDenimApplication();
  const notifications = useDenimNotifications();
  const [payrollPeriod, setPayrollPeriod] =
    useState<DenimRelatedRecord | null>(null);
  const [departments, setDepartments] =
    useState<DenimRelatedRecordCollection | null>(null);
  const [employees, setEmployees] =
    useState<DenimRelatedRecordCollection | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <DenimApplicationLayout
      content={[
        <Link to="/">
          <img
            src={LemonadeLogo}
            alt="Lemonade HR"
            style={{ width: '180px' }}
          />
        </Link>,
        <>
          <h1>Timekeeping Portal</h1>
          <p>
            Generate the total labor hours report in this page for uploading to
            the LemonadePay Portal.
          </p>
        </>,
        <DenimApplicationField
          schema={{
            id: 'period',
            label: 'Payroll Period',
            type: DenimFormControlType.DropDown,
            controlProps: {
              relationship: 'pdy-payroll-periods',
            },
          }}
          value={payrollPeriod}
          onChange={setPayrollPeriod}
        />,
        <DenimApplicationField
          schema={{
            id: 'period-date',
            label: 'Period Date',
            type: DenimFormControlType.TextInput,
            controlProps: {
              disabled: true,
            },
          }}
          value={
            payrollPeriod &&
            `${moment(String(payrollPeriod.record?.Start)).format(
              'MMM DD, Y',
            )} - ${moment(String(payrollPeriod.record?.End)).format(
              'MMM DD, Y',
            )}`
          }
        />,
        <DenimApplicationField
          schema={{
            id: 'departments',
            label: 'Departments',
            type: DenimFormControlType.MultiLookup,
            controlProps: {
              relationship: 'Department',
            },
          }}
          value={departments}
          onChange={setDepartments}
        />,
        <DenimApplicationField
          schema={{
            id: 'employees',
            label: 'Employees',
            type: DenimFormControlType.MultiLookup,
            controlProps: {
              relationship: 'Employee',
            },
          }}
          value={employees}
          onChange={setEmployees}
        />,
        <DenimApplicationButton
          text="Generate Report View"
          disabled={
            loading ||
            !payrollPeriod ||
            (!departments?.records.length && !employees?.records.length)
          }
          action={{
            callback: async () => {
              const context: DenimWorkflowContext = {
                executingUser: application.user,
              };
              setLoading(true);

              try {
                await application.dataSource?.executeWorkflow(
                  'laborHours',
                  {
                    period: payrollPeriod,
                    departments,
                    employees,
                  },
                  context,
                );

                window.location.href = process.env.REACT_APP_TIMEKEEPING_EXPORT_URL || 'https://airtable.com/shrkY5E5kAYgrgVZW';
              } catch (e) {
                if (!notifications.handleError(e)) {
                  notifications.notify({
                    type: 'error',
                    message: e.message,
                    code: DenimNotificationCodes.WorkflowExecutionFailed,
                  });
                }
              }

              setLoading(false);
            },
          }}
        />,
        loading ? <ActivityIndicator /> : <></>,
      ]}
    />
  );
};

export default TimekeepingPortal;
