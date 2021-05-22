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
                      <DenimApplicationLayout
                        flowDirection="row"
                        content={[
                          {
                            relativeWidth: 1,
                            element: (
                              <DenimApplicationField
                                schema={{
                                  id: 'Employee ID',
                                }}
                              />
                            ),
                          },
                          {
                            relativeWidth: 4,
                            element: (
                              <DenimApplicationField
                                schema={{
                                  id: 'Full Name',
                                }}
                              />
                            ),
                          },
                        ]}
                      />,
                      <DenimApplicationLayout
                        flowDirection="row"
                        content={[
                          <DenimApplicationField
                            schema={{
                              id: 'Title',
                            }}
                          />,
                          <DenimApplicationField
                            schema={{
                              id: 'Last Name',
                            }}
                          />,
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
                              id: 'Nickname',
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
                              id: 'Marital Status',
                            }}
                          />,
                          {
                            relativeWidth: 3,
                            element: (
                              <DenimApplicationField
                                schema={{
                                  id: 'Date of Birth',
                                }}
                              />
                            ),
                          },
                        ]}
                      />,
                      <DenimApplicationLayout
                        flowDirection="row"
                        content={[
                          <DenimApplicationField
                            schema={{
                              id: 'Email',
                            }}
                          />,
                          {
                            relativeWidth: 2,
                            element: (
                              <DenimApplicationField
                                schema={{
                                  id: 'LinkedIn Account',
                                }}
                              />
                            ),
                          },
                        ]}
                      />,
                      <DenimApplicationField
                        schema={{
                          id: 'Address 1',
                        }}
                      />,
                      <DenimApplicationField
                        schema={{
                          id: 'Address 2',
                        }}
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
                              id: 'Home Number',
                            }}
                          />,
                          {
                            relativeWidth: 2,
                            element: (
                              <DenimApplicationField
                                schema={{
                                  id: 'Mobile Number',
                                }}
                              />
                            ),
                          },
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
                              id: 'Relation to Contact Person',
                            }}
                          />,
                          <DenimApplicationField
                            schema={{
                              id: 'Contact Person Mobile No',
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
                      <DenimApplicationLayout
                        flowDirection="row"
                        content={[
                          <DenimApplicationField
                            schema={{
                              id: 'Account Status',
                            }}
                          />,
                          <DenimApplicationField
                            schema={{
                              id: 'Entry Date',
                            }}
                          />,
                          <DenimApplicationField
                            schema={{
                              id: 'Exit Date',
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
                              controlProps: {
                                dropdown: true,
                              },
                            }}
                          />,
                        ]}
                      />,
                      <DenimApplicationLayout
                        flowDirection="row"
                        content={[
                          <DenimApplicationField
                            schema={{
                              id: 'Department',
                            }}
                          />,
                          <DenimApplicationField
                            schema={{
                              id: 'Department Supervisor',
                            }}
                          />,
                          <DenimApplicationField
                            schema={{
                              id: 'Member Type',
                            }}
                          />,
                          <DenimApplicationField
                            schema={{
                              id: 'Direct Manager',
                            }}
                          />,
                        ]}
                      />,
                      <DenimApplicationLayout
                        flowDirection="row"
                        content={[
                          <DenimApplicationField
                            schema={{
                              id: 'Job Title',
                            }}
                          />,
                          <DenimApplicationField
                            schema={{
                              id: 'Job Positions',
                            }}
                          />,
                          {
                            relativeWidth: 2,
                            element: (
                              <DenimApplicationField
                                schema={{
                                  id: 'Job Roles',
                                }}
                              />
                            ),
                          },
                        ]}
                      />,
                      <DenimApplicationLayout
                        flowDirection="row"
                        content={[
                          {
                            relativeWidth: 1,
                            element: (
                              <DenimApplicationField
                                schema={{
                                  id: 'Language',
                                }}
                              />
                            ),
                          },
                          {
                            relativeWidth: 3,
                            element: (
                              <DenimApplicationField
                                schema={{
                                  id: 'Skills',
                                }}
                              />
                            ),
                          },
                        ]}
                      />,
                    ]}
                  />
                ),
              },
              {
                label: 'Compensation & Benefits',
                content: <AllowancesButton />,
              },
            ]}
          />
        ),
      },
    ]}
  />
);

export default EmployeeForm;
