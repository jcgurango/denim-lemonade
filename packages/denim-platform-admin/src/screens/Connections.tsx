import React from 'react';
import { FunctionComponent } from 'react';
import { DenimApplicationRepeater, DenimScreenV2, useDenimApplication } from 'denim-forms';
import styled from 'styled-components';

const ConnectionContainer = styled.div`
  box-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
  padding: 1em;
  border-radius: 8px;
  background-color: white;
  width: 100%;
  margin-bottom: 1em;
`;

const Connection: FunctionComponent<{}> = () => {
  const application = useDenimApplication();

  return (
    <ConnectionContainer>
      {application.record?.name}
    </ConnectionContainer>
  );
};

const Connections: FunctionComponent<{}> = () => {
  return (
    <>
      <DenimScreenV2 id="connections" paths={['/']}>
        <DenimApplicationRepeater
          table="data-connections"
          columns={['name', 'type']}
        >
          <Connection />
        </DenimApplicationRepeater>
      </DenimScreenV2>
      <DenimScreenV2 id="connection" paths={['/connections/:id']}>
        <DenimApplicationRepeater
          table="data-connections"
          columns={['name', 'type']}
        ></DenimApplicationRepeater>
      </DenimScreenV2>
    </>
  );
};

export default Connections;
