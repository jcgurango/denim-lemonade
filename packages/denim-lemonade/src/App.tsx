import React, { FunctionComponent, useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import CopyLink from './components/CopyLink';
import { DenimRemoteDataSourceV2 } from 'denim';
import {
  DenimApplicationForm,
  DenimApplicationLayout,
  DenimApplicationV2,
  DenimApplicationGuard,
  useDenimApplication,
  DenimScreenV2,
  DenimFormProvider,
  DenimUserProviderV2,
  useDenimUserV2,
  useDenimForm,
  DenimRouter,
} from 'denim-forms';
import { LemonadeValidations } from './validation';
import LemonadeButton from './components/LemonadeButton';
import {
  LemonadeCell,
  LemonadeHeaderCell,
  LemonadeHeaderRow,
  LemonadeRow,
} from './components/LemonadeView';
import LemonadeFormControl from './components/LemonadeFormControl';
import EmployeeForm from './components/EmployeeForm';
import { useHistory } from 'react-router';
import EmployeeList from './components/EmployeeList';
import MovementScreen from './components/MovementScreen';
import TimekeepingPortal from './components/TimekeepingPortal';

const dataSource = new DenimRemoteDataSourceV2(
  (process.env.REACT_APP_API_BASE || window.location.origin) + '/api/data',
);
LemonadeValidations(dataSource);

const SelfEmployeeForm = () => {
  const { user } = useDenimApplication();

  return (
    <DenimApplicationForm table="Employee" record={user?.id}>
      <EmployeeForm />
    </DenimApplicationForm>
  );
};

const HREmployeeForm = () => {
  const { routeParameters } = useDenimApplication();
  const history = useHistory();

  return (
    <DenimApplicationForm
      table="Employee"
      record={routeParameters?.id}
      onSave={(record) => {
        history.push(`/employee/${record.id}`);
      }}
    >
      <DenimApplicationLayout
        content={[
          {
            id: 'copy-link',
            element: <CopyLink />,
          },
          {
            id: 'form',
            element: <EmployeeForm />,
          },
        ]}
      />
    </DenimApplicationForm>
  );
};

const App: FunctionComponent<{}> = () => {
  const user = useDenimUserV2();

  dataSource.headers = {
    Authorization: user.token ? `Bearer ${user.token}` : '',
  };

  const [schemaRetrieved, setSchemaRetrieved] = useState(false);

  useEffect(() => {
    (async () => {
      await dataSource.retrieveSchema();
      setSchemaRetrieved(true);
    })();
  }, []);

  if (window.location.pathname === '/loading' || !schemaRetrieved) {
    return <ActivityIndicator />;
  }

  return (
    <DenimApplicationV2 dataSource={dataSource}>
      <DenimRouter>
        <DenimApplicationGuard allowedRoles={['employee']}>
          <DenimScreenV2
            id="employee-self"
            paths={['/']}
            allowedRoles={['employee']}
          >
            <SelfEmployeeForm />
          </DenimScreenV2>
        </DenimApplicationGuard>
        <DenimApplicationGuard allowedRoles={['hr', 'hr-user']}>
          <DenimScreenV2
            id="employee-list"
            paths={['/']}
            allowedRoles={['hr', 'hr-user']}
          >
            <EmployeeList />
          </DenimScreenV2>
        </DenimApplicationGuard>
        <DenimScreenV2
          id="employee-self"
          paths={['/me']}
          allowedRoles={['hr', 'hr-user']}
        >
          <SelfEmployeeForm />
        </DenimScreenV2>
        <DenimScreenV2
          id="employee"
          paths={['/employee', '/employee/:id']}
          allowedRoles={['hr', 'hr-user']}
        >
          <HREmployeeForm />
        </DenimScreenV2>
        <DenimScreenV2
          id="timekeeping"
          paths={['/timekeeping-portal']}
          allowedRoles={['hr']}
        >
          <TimekeepingPortal />
        </DenimScreenV2>
        <MovementScreen
          id="job-position"
          columns={['Job Position']}
          table="Job Position Movement"
        />
        <MovementScreen
          id="department"
          columns={['Department']}
          table="Department Movement"
        />
        <MovementScreen
          id="basic-pay"
          columns={['Basic Pay']}
          table="Basic Pay Movement"
        />
        <MovementScreen
          id="employment-status"
          columns={['Employment Status']}
          table="Employment Status Movement"
        />
        <MovementScreen
          id="allowance"
          columns={['Allowance', 'Amount']}
          table="Allowance Movement"
        />
      </DenimRouter>
    </DenimApplicationV2>
  );
};

const AuthenticatedApp = () => {
  const form = useDenimForm();

  return (
    <DenimUserProviderV2
      authUrl={
        (process.env.REACT_APP_API_BASE || window.location.origin) + '/api/auth'
      }
      rolesUrl={
        (process.env.REACT_APP_API_BASE || window.location.origin) +
        '/api/data/roles'
      }
    >
      <DenimFormProvider
        componentRegistry={{
          ...form.componentRegistry,
          button: LemonadeButton,
          viewHeaderRow: LemonadeHeaderRow,
          viewHeaderCell: LemonadeHeaderCell,
          viewRow: LemonadeRow,
          viewCell: LemonadeCell,
          control: LemonadeFormControl,
        }}
        styleOverrides={{
          formSection: {
            label: {
              fontSize: 22,
              fontFamily: 'Open Sans',
              fontWeight: 'bold',
              color: '#10AC84',
            },
          },
          tabControl: {
            container: {
              borderRadius: 12,
              overflow: 'hidden',
              borderColor: '#374056',
            },
            tabHeaderContainer: {
              backgroundColor: '#374056',
            },
            tabHeader: {
              backgroundColor: '#374056',
              padding: 22,
            },
            tabHeaderText: {
              fontSize: 22,
              fontFamily: 'Open Sans',
            },
            selectedTabHeader: {
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
              paddingHorizontal: 44,
            },
            selectedTabHeaderText: {
              fontSize: 22,
              fontFamily: 'Open Sans',
              fontWeight: 'bold',
              color: '#10AC84',
            },
            contentContainer: {
              paddingHorizontal: 60,
              paddingVertical: 36,
            },
          },
        }}
      >
        <App />
      </DenimFormProvider>
    </DenimUserProviderV2>
  );
};

export default AuthenticatedApp;
