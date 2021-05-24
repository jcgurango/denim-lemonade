import React, { FunctionComponent } from 'react';
import styled from 'styled-components';

export interface DenimControlContainerProps {
  error?: boolean;
  helpText?: String;
}

const Container = styled.div`
  padding: 0.75em;
  border-bottom-width: 1px;
  border-bottom-color: #dedede;

  &.error {
    border-bottom-color: red;
  }
`;

const HelpText = styled.div`
  font-size: 1em;
  margin-top: 1.25em;

  &.error {
    color: red;
  }
`;

const DenimControlContainer: FunctionComponent<DenimControlContainerProps> = ({
  children,
  error,
  helpText,
}) => {
  return (
    <>
      <Container className={error ? 'error' : ''}>{children}</Container>
      {helpText ? (
        <HelpText className={error ? 'error' : ''}>{helpText}</HelpText>
      ) : null}
    </>
  );
};

export default DenimControlContainer;
