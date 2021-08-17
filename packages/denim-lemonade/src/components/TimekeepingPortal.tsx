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
import { ExportToCsv } from 'export-to-csv';

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
  const [showDialog, setShowDialog] = useState(false);
  const exportUrl =
    process.env.REACT_APP_TIMEKEEPING_EXPORT_URL ||
    'https://airtable.com/shrkY5E5kAYgrgVZW';

  return (
    <>
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
              Generate the total labor hours report in this page for uploading
              to the LemonadePay Portal.
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
                disabled: !payrollPeriod,
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
                disabled: !payrollPeriod,
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

                  setShowDialog(true);
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
      {showDialog ? (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '2em',
              borderRadius: '2em',
            }}
          >
            <DenimApplicationLayout
              flowDirection="column"
              content={[
                <div style={{ width: '55vw', height: '65vh' }}>
                  <iframe
                    style={{ width: '100%', height: '100%', border: 0 }}
                    title="Attendance Export"
                    src={exportUrl.replace('shr', 'embed/shr')}
                  />
                </div>,
                <DenimApplicationLayout
                  flowDirection="row"
                  content={[
                    {
                      relativeWidth: 2,
                      element: <div></div>,
                    },
                    <DenimApplicationButton
                      text="Close"
                      action={{ callback: () => setShowDialog(false) }}
                      type="secondary"
                    />,
                    <DenimApplicationButton
                      text="Download Report"
                      action={{
                        callback: async () => {
                          const context: DenimWorkflowContext = {
                            executingUser: application.user,
                          };
                          setLoading(true);

                          try {
                            await application.dataSource?.executeWorkflow(
                              'laborHoursReport',
                              {},
                              context,
                            );

                            const columns = [
                              'employee_id',
                              'payroll_period_id',
                              'payroll_days',
                              'absences',
                              'leaves',
                              'holidays',
                              'part_time',
                              'late',
                              'undertime',
                              'reg_np',
                              'reg_ot',
                              'reg_ot_np',
                              'reg_ot_ex',
                              'reg_ot_ex_np',
                              'leg_ot',
                              'leg_ot_np',
                              'leg_ot_ex',
                              'leg_ot_ex_np',
                              'sp_ot',
                              'sp_ot_np',
                              'sp_ot_ex',
                              'sp_ot_ex_np',
                              'rst_ot',
                              'rst_ot_np',
                              'rst_ot_ex',
                              'rst_ot_ex_np',
                              'leg_rst_ot',
                              'leg_rst_ot_np',
                              'leg_rst_ot_ex',
                              'leg_rst_ot_ex_np',
                              'sp_rst_ot',
                              'sp_rst_ot_np',
                              'sp_rst_ot_ex',
                              'sp_rst_ot_ex_np',
                              'allowance_1',
                              'allowance_2',
                              'allowance_3',
                              'allowance_4',
                              'allowance_5',
                              'allowance_6',
                              'allowance_7',
                              'allowance_8',
                              'allowance_9',
                              'allowance_10',
                              'allowance_11',
                              'allowance_12',
                            ];

                            if (context.resultingAction?.$action === 'result') {
                              const exporter = new ExportToCsv({
                                fieldSeparator: ',',
                                quoteStrings: '"',
                                decimalSeparator: '.',
                                showLabels: true,
                                useTextFile: false,
                                useBom: true,
                                filename: 'attendance_export',
                                headers: columns,
                              });

                              exporter.generateCsv(
                                Object.values(
                                  context.resultingAction.result,
                                ).map((item) =>
                                  columns.map(
                                    (column) => (item as any)[column],
                                  ),
                                ),
                              );
                            }
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
                      disabled={loading}
                    />,
                  ]}
                />,
              ]}
            />
          </div>
        </div>
      ) : null}
    </>
  );
};

export default TimekeepingPortal;
