import React, {
  createContext,
  FunctionComponent,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import bent from 'bent';
import { useHistory } from 'react-router';
import { DenimNotificationCodes } from 'denim';
import { useDenimNotifications } from '../../forms';
import qs from 'qs';
import { useState } from 'react';
import { DenimRecord } from 'denim/core';
import {
  DenimApplicationContext,
  useDenimApplication,
} from '../DenimApplicationV2';
import { ActivityIndicator } from 'react-native';

export interface DenimApplicationAuthenticationContextProps {
  authorize: (slug: string, body: any) => Promise<void>;
}

const DenimApplicationAuthenticationContext =
  createContext<DenimApplicationAuthenticationContextProps>({
    authorize: () => {
      throw new Error('No authentication provider');
    },
  });

export const useDenimAuth = () =>
  useContext(DenimApplicationAuthenticationContext);

const DenimApplicationAuthenticationProvider: FunctionComponent<{
  authUrl: string;
}> = ({ authUrl, children }) => {
  const application = useDenimApplication();
  const notifications = useDenimNotifications();
  const history = useHistory();
  const [roles, setRoles] = useState([]);
  const [user, setUser] = useState<DenimRecord | undefined>(undefined);
  const [currentToken, setCurrentToken] = useState<string | undefined>(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('denimToken') || undefined;
    }

    return undefined;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {}, [currentToken]);

  const { post, get } = useMemo(
    () => ({
      post: bent('POST', 'json', authUrl),
      get: bent('GET', 'json', authUrl),
    }),
    [authUrl]
  );

  useEffect(() => {
    if (history.location.pathname === '/auth/callback') {
      (async () => {
        try {
          try {
            const { provider, ...otherParams } = qs.parse(
              (window.location.search || '').substring(1)
            );
            const { accessToken, redirectUrl } = await get(
              `/database/callback?${qs.stringify(otherParams)}`
            );

            setCurrentToken(accessToken);
            localStorage.setItem('denimToken', accessToken);
            window.location.href = redirectUrl;
          } catch (e) {
            if (e.json) {
              const { error } = await e.json();

              if (error) {
                throw new Error(error);
              }
            }

            throw new Error('Error occurred.');
          }
        } catch (e) {
          notifications.notify({
            type: 'error',
            message: e.message,
            code: DenimNotificationCodes.AuthError,
          });
        }
      })();
    }
  }, [history.location.pathname]);

  useEffect(() => {
    if (currentToken) {
      let cancelled = false;
      setLoading(true);

      (async () => {
        const user = await get('/me', undefined, {
          Authorization: 'Bearer ' + currentToken,
        });
        const roles = await get('/roles', undefined, {
          Authorization: 'Bearer ' + currentToken,
        });

        if (!cancelled) {
          if (user) {
            setUser(user);
          } else {
            setUser(undefined);
          }

          if (roles) {
            setRoles(roles);
          } else {
            setRoles([]);
          }

          setLoading(false);
        }
      })();

      return () => {
        cancelled = true;
      };
    }
  }, [currentToken, get]);

  if (loading) {
    return (<ActivityIndicator />);
  }

  return (
    <DenimApplicationAuthenticationContext.Provider
      value={{
        authorize: async (slug, body) => {
          try {
            const { redirect_url } = await post(`/${slug}`, {
              redirect_url: window.location.href,
              ...(body || {}),
            });

            window.location.href = redirect_url;
          } catch (e) {
            if (e.json) {
              const { error } = await e.json();

              if (error) {
                throw new Error(error);
              }
            }

            throw new Error('Error occurred.');
          }
        },
      }}
    >
      <DenimApplicationContext.Provider
        value={{ ...application, user, roles, token: currentToken }}
      >
        {children}
      </DenimApplicationContext.Provider>
    </DenimApplicationAuthenticationContext.Provider>
  );
};

export default DenimApplicationAuthenticationProvider;
