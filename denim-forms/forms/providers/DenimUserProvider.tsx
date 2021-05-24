import React, {
  createContext,
  FunctionComponent,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import bent from 'bent';
import { ActivityIndicator } from 'react-native';
import qs from 'querystring';
import { DenimRecord } from 'denim';

export interface DenimUserContextProps {
  token?: string;
  user: DenimRecord | null;
  roles: string[];
}

const DenimUserContext = createContext<DenimUserContextProps>({
  user: null,
  roles: [],
});

export const useDenimUser = () => useContext(DenimUserContext);

const DenimUserProvider: FunctionComponent<{ authUrl: string }> = ({
  authUrl,
  children,
}) => {
  const [currentToken, setCurrentToken] = useState('');
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const { get, post } = useMemo(() => {
    return {
      get: bent('json', 'GET', authUrl, currentToken ? { Authorization: 'Bearer ' + currentToken } : { }),
      post: bent('json', 'POST', authUrl, currentToken ? { Authorization: 'Bearer ' + currentToken } : { }),
    };
  }, [authUrl, currentToken]);

  useEffect(() => {
    if (!currentToken) {
      (async () => {
        try {
          const token = await AsyncStorage.getItem('denimToken');

          if (token) {
            // Verify the token.
            const { valid } = await get(
              '/verify?token=' + encodeURIComponent(token),
            );

            if (valid) {
              return setCurrentToken(token);
            }

            await AsyncStorage.removeItem('denimToken');
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
            await AsyncStorage.setItem('denimToken', token);
            setCurrentToken(token);
            return;
          } catch (e) {
            console.error(e);
          }
        }

        // Retrieve a new token.
        const { url } = await get(
          '/?type=web&redirect_url=' + encodeURIComponent(window.location.href.split('?')[0]),
        );

        window.location.href = url;
      })();
    }
  }, [authUrl, currentToken]);

  useEffect(() => {
    if (currentToken) {
      let cancelled = false;

      (async () => {
        const user = await get('/me');

        if (!cancelled) {
          if (user) {
            setUser(user.userData);
            setRoles(user.roles);
          } else {
            localStorage.removeItem('denimToken');
            setCurrentToken('');
          }
        }
      })();

      return () => {
        cancelled = true;
      };
    }
  }, [currentToken, get]);

  if (!currentToken || !user) {
    return <ActivityIndicator />;
  }

  return (
    <DenimUserContext.Provider
      value={{ token: currentToken, user, roles }}
    >
      {children}
    </DenimUserContext.Provider>
  );
};

export default DenimUserProvider;
