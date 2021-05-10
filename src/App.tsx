import React, { FunctionComponent, useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import CopyLink from './components/CopyLink';
import {
  DenimApplicationForm,
  DenimApplicationLayout,
  DenimApplicationV2,
  useDenimApplication,
} from './denim/application';
import {
  DenimFormProvider,
  DenimUserProviderV2,
  useDenimUserV2,
} from './denim/forms';
import DenimRemoteDataSourceV2 from './denim/service/DenimRemoteDataSourceV2';
import { LemonadeValidations } from './validation';
import { useDenimForm } from './denim/forms/providers/DenimFormProvider';
import LemonadeButton from './components/LemonadeButton';
import {
  LemonadeCell,
  LemonadeHeaderCell,
  LemonadeHeaderRow,
  LemonadeRow,
} from './components/LemonadeView';
import LemonadeFormControl from './components/LemonadeFormControl';
import EmployeeForm from './components/EmployeeForm';
import DenimRouter from './denim/application/DenimRouter';
import DenimScreenV2 from './denim/application/screens/DenimScreenV2';
import { useHistory } from 'react-router';

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
        <DenimScreenV2
          id="employee-self"
          paths={['/']}
          allowedRoles={['employee']}
        >
          <SelfEmployeeForm />
        </DenimScreenV2>
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
