import React, { FunctionComponent, ReactChild } from 'react';
import { Button } from 'react-native';
import { DenimRecord, DenimViewSchema } from '../core';
import { useDenimViewData } from './providers/DenimViewDataProvider';

export interface DenimViewProps {
  schema: DenimViewSchema;
  renderActions?: (record: DenimRecord) => ReactChild;
}

const DenimView: FunctionComponent<DenimViewProps> = ({
  schema,
  renderActions,
}) => {
  const view = useDenimViewData();

  return (
    <>
      <table>
        <thead>
          <tr>
            {schema.columns.map((column) => (
              <th>{column}</th>
            ))}
            {renderActions ? <th>#</th> : null}
          </tr>
        </thead>
        <tbody>
          {view.records.map((record) => (
            <tr key={record.id}>
              {schema.columns.map((column) => (
                <td>{record[column]}</td>
              ))}
              {renderActions ? <th>{renderActions(record)}</th> : null}
            </tr>
          ))}
        </tbody>
      </table>
      {view.hasMore ? (
        <Button
          title="Retrieve More"
          disabled={view.retrieving}
          onPress={view.retrieveMore}
        />
      ) : null}
    </>
  );
};

export default DenimView;
