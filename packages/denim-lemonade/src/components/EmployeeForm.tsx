import React from 'react';
import { Link } from 'react-router-dom';
import {
  DenimApplicationButton,
  DenimApplicationField,
  DenimApplicationLayout,
  DenimApplicationTabControl,
  useDenimApplication,
} from 'denim-forms';
import LemonadeLogo from '../assets/images/logo.jpg';
import { FunctionComponent } from 'react';

const AllowancesButton = () => {
  const application = useDenimApplication();

  return (
    <DenimApplicationButton
      text="View Allowances"
      action={{
        link: `/movements/${application.record?.['Employee ID']}/allowances`,
      }}
    />
  );
};

const EmployeeForm: FunctionComponent<{}> = () => (
  <DenimApplicationLayout
    flowDirection="row"
    content={[
      {
        id: 'left-side',
        relativeWidth: 1,
        element: (
          <DenimApplicationLayout
            content={[
              <Link to="/" style={{ textAlign: 'center' }}>
                <img
                  src={LemonadeLogo}
                  alt="Lemonade HR"
                  style={{ width: '180px' }}
                />
              </Link>,
              <DenimApplicationLayout
                flowDirection="column"
                content={[
                  <DenimApplicationField
                    schema={{
                      id: 'Full Name',
                      controlProps: { disabled: true },
                    }}
                  />,
                  <DenimApplicationField
                    schema={{
                      id: 'Job Title',
                      controlProps: { disabled: true },
                    }}
                  />,
                  <DenimApplicationField
                    schema={{
                      id: 'Department',
                      controlProps: { disabled: true },
                    }}
                  />,
                  <DenimApplicationField
                    schema={{
                      id: 'Entry Date',
                      controlProps: { disabled: true },
                    }}
                  />,
                  <DenimApplicationField
                    schema={{
                      id: 'Mobile Number',
                      controlProps: { disabled: true },
                    }}
                  />,
                  <DenimApplicationField
                    schema={{
                      id: 'Email',
                      controlProps: { disabled: true },
                    }}
                  />,
                ]}
              />,
            ]}
          />
        ),
      },
      {
        id: 'employee-form-tabs',
        relativeWidth: 4,
        element: (
          <DenimApplicationTabControl
            tabs={[
              {
                label: 'Personal',
                content: (
                  <DenimApplicationLayout
                    content={[
                      <h2>Basic Information</h2>,
                      <DenimApplicationLayout
                        flowDirection="row"
                        content={[
                          <DenimApplicationField
                            schema={{
                              id: 'First Name',
                            }}
                          />,
                          <DenimApplicationField
                            schema={{
                              id: 'Middle Name',
                            }}
                          />,
                          <DenimApplicationField
                            schema={{
                              id: 'Last Name',
                            }}
                          />,
                        ]}
                      />,
                      <DenimApplicationLayout
                        flowDirection="row"
                        content={[
                          <DenimApplicationField
                            schema={{
                              id: 'Nickname',
                            }}
                          />,
                          <DenimApplicationField
                            schema={{
                              id: 'Date of Birth',
                            }}
                          />,
                          <DenimApplicationField
                            schema={{
                              id: 'Marital Status',
                            }}
                          />,
                        ]}
                      />,
                      <DenimApplicationLayout
                        flowDirection="row"
                        content={[
                          <DenimApplicationField
                            schema={{
                              id: 'Gender',
                            }}
                          />,
                          <DenimApplicationField
                            schema={{
                              id: 'Citizenship',
                            }}
                          />,
                          <DenimApplicationField
                            schema={{
                              id: 'Nationality',
                            }}
                          />,
                        ]}
                      />,
                      <DenimApplicationLayout
                        flowDirection="row"
                        content={[
                          <DenimApplicationField
                            schema={{
                              id: 'Language',
                            }}
                          />,
                          {
                            relativeWidth: 2,
                            element: <></>,
                          },
                        ]}
                      />,
                      <h2>Contact Information</h2>,
                      <DenimApplicationLayout
                        flowDirection="row"
                        content={[
                          <DenimApplicationField
                            schema={{
                              id: 'Email',
                            }}
                          />,
                          <DenimApplicationField
                            schema={{
                              id: 'Mobile Number',
                            }}
                          />,
                          <DenimApplicationField
                            schema={{
                              id: 'Home Number',
                            }}
                          />,
                        ]}
                      />,
                      <DenimApplicationLayout
                        flowDirection="row"
                        content={[
                          <DenimApplicationField
                            schema={{
                              id: 'House No & Street Name',
                            }}
                          />,
                          <DenimApplicationField
                            schema={{
                              id: 'Village/Compound',
                            }}
                          />,
                          <DenimApplicationField
                            schema={{
                              id: 'Barangay',
                            }}
                          />,
                        ]}
                      />,
                      <DenimApplicationLayout
                        flowDirection="row"
                        content={[
                          <DenimApplicationField
                            schema={{
                              id: 'City',
                            }}
                          />,
                          <DenimApplicationField
                            schema={{
                              id: 'State/Province',
                            }}
                          />,
                          <DenimApplicationField
                            schema={{
                              id: 'Zip',
                            }}
                          />,
                        ]}
                      />,
                      <DenimApplicationField
                        schema={{
                          id: 'Address 1',
                        }}
                      />,
                      <DenimApplicationLayout
                        flowDirection="row"
                        content={[
                          {
                            relativeWidth: 2,
                            element: (
                              <DenimApplicationField
                                schema={{
                                  id: 'Address 2',
                                }}
                              />
                            ),
                          },
                          <DenimApplicationField
                            schema={{
                              id: 'Country',
                            }}
                          />,
                        ]}
                      />,
                      <DenimApplicationLayout
                        flowDirection="row"
                        content={[
                          <DenimApplicationField
                            schema={{
                              id: 'Contact Person',
                            }}
                          />,
                          <DenimApplicationField
                            schema={{
                              id: 'Contact Person Mobile No',
                            }}
                          />,
                          <DenimApplicationField
                            schema={{
                              id: 'Relation to Contact Person',
                            }}
                          />,
                        ]}
                      />,
                    ]}
                  />
                ),
              },
              {
                label: 'Employment',
                content: (
                  <DenimApplicationLayout
                    content={[
                      <h2>Employment Information</h2>,
                      <DenimApplicationLayout
                        flowDirection="row"
                        content={[
                          <DenimApplicationField
                            schema={{
                              id: 'Employee ID',
                            }}
                          />,
                          <DenimApplicationField
                            schema={{
                              id: 'Account Status',
                            }}
                          />,
                          <></>,
                        ]}
                      />,
                      <DenimApplicationLayout
                        flowDirection="row"
                        content={[
                          <DenimApplicationField
                            schema={{
                              id: 'Employment Status',
                            }}
                          />,
                          <DenimApplicationField
                            schema={{
                              id: 'Job Title',
                            }}
                          />,
                          <></>,
                        ]}
                      />,
                      <DenimApplicationLayout
                        flowDirection="row"
                        content={[
                          <DenimApplicationField
                            schema={{
                              id: 'Job Level',
                            }}
                          />,
                          <DenimApplicationField
                            schema={{
                              id: 'Department',
                            }}
                          />,
                          <DenimApplicationField
                            schema={{
                              id: 'Company',
                            }}
                          />,
                        ]}
                      />,
                      <DenimApplicationLayout
                        flowDirection="row"
                        content={[
                          <DenimApplicationField
                            schema={{
                              id: 'Is A Manager',
                            }}
                          />,
                          <DenimApplicationField
                            schema={{
                              id: 'Direct Manager',
                            }}
                          />,
                          <DenimApplicationField
                            schema={{
                              id: 'Workplace',
                            }}
                          />,
                        ]}
                      />,
                      <DenimApplicationLayout
                        flowDirection="row"
                        content={[
                          <DenimApplicationField
                            schema={{
                              id: 'Entry Date',
                            }}
                          />,
                          <DenimApplicationField
                            schema={{
                              id: 'Regularization Date',
                            }}
                          />,
                          <DenimApplicationField
                            schema={{
                              id: 'Exit Date',
                            }}
                          />,
                        ]}
                      />,
                      <DenimApplicationField
                        schema={{
                          id: 'Skills',
                        }}
                      />,
                    ]}
                  />
                ),
              },
              {
                label: 'Compensation & Benefits',
                content: (
                  <DenimApplicationLayout
                    content={[
                      <h2>Compensation &amp; Benefits</h2>,
                      <DenimApplicationLayout
                        flowDirection="row"
                        content={[
                          <DenimApplicationField
                            schema={{
                              id: 'Basic Pay',
                            }}
                          />,
                          <DenimApplicationField
                            schema={{
                              id: 'E-Cola',
                            }}
                          />,
                          <DenimApplicationField
                            schema={{
                              id: 'Wage Zone',
                            }}
                          />,
                        ]}
                      />,
                      <DenimApplicationLayout
                        flowDirection="row"
                        content={[
                          <DenimApplicationField
                            schema={{
                              id: 'Payroll Grouping',
                            }}
                          />,
                          <DenimApplicationField
                            schema={{
                              id: 'Payment Method',
                            }}
                          />,
                          <DenimApplicationField
                            schema={{
                              id: 'Pay Basis',
                            }}
                          />,
                        ]}
                      />,
                      <DenimApplicationLayout
                        flowDirection="row"
                        content={[
                          <DenimApplicationField
                            schema={{
                              id: 'Bank',
                            }}
                          />,
                          <DenimApplicationField
                            schema={{
                              id: 'Bank Account',
                            }}
                          />,
                          <DenimApplicationField
                            schema={{
                              id: 'HMO Number',
                            }}
                          />,
                        ]}
                      />,
                      <h2>ID Numbers</h2>,
                      <DenimApplicationLayout
                        flowDirection="row"
                        content={[
                          <DenimApplicationField
                            schema={{
                              id: 'SSS Number',
                            }}
                          />,
                          <DenimApplicationField
                            schema={{
                              id: 'Philhealth Number',
                            }}
                          />,
                          <DenimApplicationField
                            schema={{
                              id: 'Pag-ibig Number',
                            }}
                          />,
                        ]}
                      />,
                      <DenimApplicationLayout
                        flowDirection="row"
                        content={[
                          <DenimApplicationField
                            schema={{
                              id: 'Tax Identification Number',
                            }}
                          />,
                          <DenimApplicationField
                            schema={{
                              id: 'Passport Number',
                            }}
                          />,
                          <></>,
                        ]}
                      />,
                    ]}
                  />
                ),
              },
              {
                label: 'Attendance & Leave',
                content: (
                  <DenimApplicationLayout
                    content={[
                      <h2>Attendance &amp; Leave Information</h2>,
                      <DenimApplicationLayout
                        flowDirection="row"
                        content={[
                          <DenimApplicationField
                            schema={{
                              id: 'Days of Work Per Year',
                            }}
                          />,
                          <DenimApplicationField
                            schema={{
                              id: 'Daily Work Hours',
                            }}
                          />,
                          <DenimApplicationField
                            schema={{
                              id: 'Leave Scheme',
                            }}
                          />,
                        ]}
                      />,
                    ]}
                  />
                ),
              },
            ]}
          />
        ),
      },
    ]}
  />
);

export default EmployeeForm;
