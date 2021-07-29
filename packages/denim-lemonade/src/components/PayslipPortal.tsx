import React, { useState } from 'react';
import { FunctionComponent } from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import {
  DenimFormControlType,
  DenimNotificationCodes,
  DenimRelatedRecord,
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

const PayslipPortal: FunctionComponent<{}> = () => {
  const application = useDenimApplication();
  const notifications = useDenimNotifications();
  const [payrollPeriod, setPayrollPeriod] =
    useState<DenimRelatedRecord | null>(null);
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
          <h1>Payslip Generation Portal</h1>
        </>,
        <DenimApplicationLayout
          flowDirection="row"
          content={[
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                height: '100%',
              }}
            >
              <h2 style={{ margin: 0, color: 'inherit' }}>Pay Period:</h2>
            </div>,
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                height: '100%',
              }}
            >
              <div style={{ flex: 1 }}>
                <DenimApplicationField
                  schema={{
                    id: 'period',
                    label: '',
                    hideLabel: true,
                    type: DenimFormControlType.DropDown,
                    controlProps: {
                      relationship: 'pdy-payroll-periods',
                    },
                  }}
                  value={payrollPeriod}
                  onChange={setPayrollPeriod}
                />
              </div>
            </div>,
          ]}
        />,
        <DenimApplicationLayout
          flowDirection="row"
          content={[
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                height: '100%',
              }}
            >
              <h2 style={{ margin: 0, color: 'inherit' }}>Period Date:</h2>
            </div>,
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                height: '100%',
              }}
            >
              <div style={{ flex: 1 }}>
                <DenimApplicationField
                  schema={{
                    id: 'period-date',
                    label: '',
                    hideLabel: true,
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
                />
              </div>
            </div>,
          ]}
        />,
        <div style={{ height: '2em' }} />,
        <DenimApplicationLayout
          flowDirection="row"
          content={[
            {
              relativeWidth: 1,
              element: (
                <DenimApplicationButton
                  text="Generate Payslip"
                  disabled={loading}
                  action={{
                    callback: async () => {
                      /*
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
                    */
                    },
                  }}
                />
              ),
            },
            {
              relativeWidth: 2,
              element: (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'row', alignItems: 'center', fontSize: '1.5em' }}>
                Processing
                </div>
              ),
            },
          ]}
        />,
        <div style={{ height: '1em' }} />,
        <DenimApplicationLayout
          flowDirection="row"
          content={[
            {
              relativeWidth: 1,
              element: (
                <DenimApplicationButton
                  text="Release Payslip"
                  disabled={loading}
                  action={{
                    callback: async () => {
                      /*
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
                    */
                    },
                  }}
                />
              ),
            },
            {
              relativeWidth: 2,
              element: (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'row', alignItems: 'center', fontSize: '1.5em' }}>
                Processing
                </div>
              ),
            },
          ]}
        />
      ]}
    />
  );
};

export default PayslipPortal;
