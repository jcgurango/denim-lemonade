import React, { FunctionComponent, ReactChild } from 'react';
import { Button } from 'react-native';
import { DenimColumnType, DenimRecord, DenimViewSchema } from '../core';
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

  const mapRecordValue = (column: string, value: any) => {
    if (value !== undefined && value !== null) {
      const tableColumn = view.schema.columns.find(({ name }) => name === column);

      if (tableColumn) {
        if (tableColumn.type === DenimColumnType.DateTime) {
          const date = new Date(value);

          if (tableColumn.properties.includesTime) {
            return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
          }
          
          return `${date.toLocaleDateString()}`;
        }

        if (tableColumn.type === DenimColumnType.Boolean) {
          return value ? 'Yes' : 'No';
        }

        if (tableColumn.type === DenimColumnType.ForeignKey) {
          if (tableColumn.properties.multiple) {
            return value.records.map(({ name }: any) => name).join(', ');
          }

          return value.name;
        }
      }
    }

    return value;
  }

  const getColumnLabel = (columnName: string) => {
    const column = view.schema.columns.find(({ name }) => name === columnName);

    if (column) {
      return column.name;
    }

    return columnName;
  }

  return (
    <>
      <table>
        <thead>
          <tr>
            {schema.columns.map((column) => (
              <th>{getColumnLabel(column)}</th>
            ))}
            {renderActions ? <th>#</th> : null}
          </tr>
        </thead>
        <tbody>
          {view.records.map((record) => (
            <tr key={record.id}>
              {schema.columns.map((column) => (
                <td>{mapRecordValue(column, record[column])}</td>
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
