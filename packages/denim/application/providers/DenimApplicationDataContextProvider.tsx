import React, { createContext, useContext } from 'react';
import { FunctionComponent } from 'react';
import { useHistory, useParams } from 'react-router';
import { DenimRecord } from '../../core';
import { ConnectedForm, useDenimUser } from '../../forms';
import {
  DenimAuthenticator,
  DenimDataSource,
  DenimSchemaSource,
} from '../../service';
import {
  DenimApplicationContextVariable,
  DenimRouterComponentSchema,
  DenimRouterParameterMap,
  DenimRouterSchema,
} from '../types/router';

export interface DenimApplicationDataContextProps {
  state: { [key: string]: any };
  setState: (key: string | ((update: any) => void), newState?: any) => void;
  readContextVariable: (
    variable: DenimApplicationContextVariable,
    record?: DenimRecord,
  ) => any;
  writeContextVariable: (
    variable: DenimApplicationContextVariable,
    value: any,
    record?: DenimRecord,
  ) => void;
  record?: DenimRecord;
  buildScreenPathFromParams: (
    screenId: string,
    record?: DenimRecord,
    paramsSchema?: DenimRouterParameterMap,
  ) => string;
  path: string;
  routerSchema: DenimRouterSchema;
  schema: DenimRouterComponentSchema;
  auth?: DenimAuthenticator<any>;
  formProvider: ConnectedForm<any, any>;
  schemaSource: DenimSchemaSource<any>;
  dataSource: DenimDataSource<any, any>;
  dataContext: any;
}

const DenimApplicationDataContext = createContext<DenimApplicationDataContextProps>(
  {
    state: {},
    setState: () => {},
    readContextVariable: () => null,
    writeContextVariable: () => {},
    buildScreenPathFromParams: () => '',
    routerSchema: { screens: [] },
    path: '',
    schema: {} as DenimRouterComponentSchema,
    formProvider: {} as ConnectedForm<any, any>,
    schemaSource: {} as DenimSchemaSource<any>,
    dataSource: {} as DenimDataSource<any, any>,
    dataContext: {},
  },
);

export const useDenimData = () => useContext(DenimApplicationDataContext);

const DenimApplicationDataContextProvider: FunctionComponent<
  Partial<DenimApplicationDataContextProps>
> = ({ children, ...props }) => {
  const parentContext = useDenimData();
  const { user } = useDenimUser();
  const history = useHistory();
  const route = useParams<any>();
  const context = {
    ...parentContext,
    ...props,
  };
  const { Context } = context.formProvider;
  const data = useContext(Context);
  context.record = props.record || data.currentRecord || context.record;

  const readContextVariable = (
    variable: DenimApplicationContextVariable,
    record: DenimRecord | undefined = context.record,
  ) => {
    if (typeof variable === 'string') {
      return variable;
    }

    if (typeof variable === 'object') {
      if ('$route' in variable) {
        return route[variable.$route];
      }

      if ('$user' in variable) {
        if (!user) {
          return null;
        }

        return user[variable.$user];
      }

      if ('$screen' in variable) {
        return context.state[variable.$screen];
      }

      if ('$record' in variable) {
        if (!record) {
          return null;
        }

        return record[variable.$record];
      }
    }

    return variable;
  };

  const writeContextVariable = (
    variable: DenimApplicationContextVariable,
    newValue: any,
    record?: DenimRecord,
  ) => {
    if (typeof variable === 'object') {
      if ('$route' in variable) {
        const newRoute = {
          ...route,
          [variable.$route]: newValue,
        };
        const currentPath = Object.keys(newRoute).reduce((current, param) => {
          return current.replace(
            ':' + param,
            readContextVariable(newRoute[param], record),
          );
        }, context.path);
        const newPath = Object.keys(newRoute).reduce((path, key) => {
          return path.replace(':' + key, newRoute[key]);
        }, context.path);

        if (currentPath !== newPath) {
          history.push(newPath);
        }
        return;
      }

      if ('$user' in variable) {
        if (user) {
          user[variable.$user] = newValue;
        }

        return;
      }

      if ('$screen' in variable) {
        context.setState(variable.$screen, newValue);
        return;
      }
    }
  };

  const buildScreenPathFromParams = (
    screenId: string,
    record?: DenimRecord,
    paramsSchema?: DenimRouterParameterMap,
  ): string => {
    const screen = context.routerSchema.screens.find(
      ({ id }) => id === screenId,
    );
    const params: {
      [param: string]: DenimApplicationContextVariable;
    } = {
      ...(paramsSchema || {}),
    };
    const pathParameters = Object.keys(params).sort().join('|');
    const path = screen?.paths.find((path) => {
      const params = [];
      const regex = /:([\w-]+)/g;
      let match;

      while ((match = regex.exec(path))) {
        params.push(match[1]);
      }

      return params.sort().join('|') === pathParameters;
    });

    if (screen && path) {
      const newPath = Object.keys(params).reduce((current, param) => {
        return current.replace(
          ':' + param,
          readContextVariable(params[param], record),
        );
      }, path);

      return newPath;
    }

    return '';
  };

  return (
    <DenimApplicationDataContext.Provider
      value={{
        ...context,
        readContextVariable,
        writeContextVariable,
        buildScreenPathFromParams,
      }}
    >
      {children}
    </DenimApplicationDataContext.Provider>
  );
};

export default DenimApplicationDataContextProvider;
