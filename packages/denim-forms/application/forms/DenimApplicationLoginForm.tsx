import { DenimFormControlType, DenimNotificationCodes } from 'denim';
import React, { useState } from 'react';
import { DenimButton, DenimFormControl, DenimFormProvider, useDenimNotifications } from '../../forms';
import { useDenimAuth } from '../providers/DenimApplicationAuthenticationProvider';

const DenimApplicationLoginForm = () => {
  const auth = useDenimAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const notifications = useDenimNotifications();

  return (
    <div
      style={{
        width: '500px',
        marginLeft: 'auto',
        marginRight: 'auto',
        marginTop: '20px',
        borderRadius: '4px',
        border: '1px solid rgb(200, 200, 200)',
        padding: '12px',
        fontFamily: 'Arial',
      }}
    >
      <DenimFormProvider
        setValue={(field) => {
          if (field === 'username') {
            return setUsername;
          }

          if (field === 'password') {
            return setPassword;
          }

          return () => {};
        }}
        getValue={(field) => {
          if (field === 'email') {
            return username;
          }

          if (field === 'password') {
            return password;
          }

          return null;
        }}
      >
        <div style={{ textAlign: 'center', fontSize: '16px' }}>Login</div>
        <div style={{ marginTop: '10px' }}>
          <DenimFormControl
            schema={{
              id: 'username',
              label: 'Username',
              type: DenimFormControlType.TextInput,
              controlProps: {
                placeholder: 'my.username',
              },
            }}
          />
        </div>
        <div style={{ marginTop: '10px' }}>
          <DenimFormControl
            schema={{
              id: 'password',
              label: 'Password',
              type: DenimFormControlType.TextInput,
              controlProps: {
                placeholder: '••••••••••••',
                secureTextEntry: true,
              },
            }}
          />
        </div>
      </DenimFormProvider>
      <div style={{ marginTop: '10px' }}>
        <DenimButton
          text="Login"
          onPress={async () => {
            try {
              setLoading(true);
              await auth.authorize('database', {
                username,
                password,
              });
            } catch (e) {
              notifications.notify({
                type: 'error',
                message: e.message,
                code: DenimNotificationCodes.AuthError,
              });
            }

            setLoading(false);
          }}
          disabled={!username || !password || loading}
        />
      </div>
    </div>
  );
};

export default DenimApplicationLoginForm;
