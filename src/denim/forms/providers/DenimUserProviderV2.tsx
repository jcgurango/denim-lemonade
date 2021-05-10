import React, {
  createContext,
  FunctionComponent,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import bent from 'bent';
import { ActivityIndicator } from 'react-native';
import qs from 'querystring';
import { DenimRecord } from '../../core';

export interface DenimUserContextV2Props {
  token?: string;
  user?: DenimRecord;
  roles: string[];
}

const DenimUserContext = createContext<DenimUserContextV2Props>({
  roles: [],
});

export const useDenimUserV2 = () => useContext(DenimUserContext);

const DenimUserProvider: FunctionComponent<{
  authUrl: string;
  rolesUrl: string;
}> = ({ authUrl, rolesUrl, children }) => {
  const [currentToken, setCurrentToken] = useState('');
  const [roles, setRoles] = useState([]);
  const [user, setUser] = useState<DenimRecord | undefined>(undefined);
  const { get, getRoles } = useMemo(() => {
    return {
      get: bent(
        'json',
        'GET',
        authUrl,
        currentToken ? { Authorization: 'Bearer ' + currentToken } : {},
      ),
      getRoles: bent(
        'json',
        'GET',
        rolesUrl,
        currentToken ? { Authorization: 'Bearer ' + currentToken } : {},
      ),
    };
  }, [authUrl, rolesUrl, currentToken]);

  useEffect(() => {
    if (!currentToken) {
      (async () => {
        try {
          const token = localStorage.getItem('denimToken');

          if (token) {
            // Verify the token.
            const { valid } = await get(
              '/verify?token=' + encodeURIComponent(token),
            );

            if (valid) {
              return setCurrentToken(token);
            }

            localStorage.removeItem('denimToken');
          }
        } catch (e) {
          console.error(e);
        }

        const parsedQs = qs.parse(window.location.search.substring(1));

        if (parsedQs.code) {
          try {
            const type = parsedQs.type || 'web';

            const { token } = await get(
              '/callback?' + qs.stringify({ type, code: parsedQs.code }),
            );

            localStorage.setItem('denimToken', token);
            setCurrentToken(token);
            return;
          } catch (e) {
            console.error(e);
          }
        }

        // Retrieve a new token.
        const { url } = await get(
          '/?type=web&redirect_url=' +
            encodeURIComponent(window.location.href.split('?')[0]),
        );

        window.location.href = url;
      })();
    }
  }, [authUrl, currentToken, get]);

  useEffect(() => {
    if (currentToken) {
      let cancelled = false;

      (async () => {
        const user = await get('/me');
        const roles = await getRoles('/');

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
        }
      })();

      return () => {
        cancelled = true;
      };
    }
  }, [currentToken, getRoles, get]);

  if (!currentToken) {
    return <ActivityIndicator />;
  }

  return (
    <DenimUserContext.Provider value={{ token: currentToken, user, roles }}>
      {children}
    </DenimUserContext.Provider>
  );
};

export default DenimUserProvider;
