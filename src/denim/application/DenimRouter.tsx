import React from 'react';
import { Fragment } from 'react';
import { FunctionComponent } from 'react';
import { Switch } from 'react-router';

const DenimRouter: FunctionComponent<{}> = ({ children }) => {
  return (
    <Switch>
      <Fragment>{children}</Fragment>
    </Switch>
  );
};

export default DenimRouter;
