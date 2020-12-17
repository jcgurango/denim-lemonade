import React, { FunctionComponent, ReactChild } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
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
      const tableColumn = view.schema.columns.find(
        ({ name }) => name === column,
      );

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
  };

  const getColumnLabel = (columnName: string) => {
    const column = view.schema.columns.find(({ name }) => name === columnName);

    if (column) {
      return column.name;
    }

    return columnName;
  };

  return (
    <>
      <View style={styles.table}>
        <View style={styles.tableHeaderRow}>
          {schema.columns.map((column) => (
            <View style={styles.tableHeaderCell}>
              <Text style={styles.tableHeaderCellText}>
                {getColumnLabel(column)}
              </Text>
            </View>
          ))}
          {renderActions ? (
            <View style={styles.tableHeaderCell}>
              <Text style={styles.tableHeaderCellText}>#</Text>
            </View>
          ) : null}
        </View>
        {view.records.map((record) => (
          <View style={styles.tableRow} key={record.id}>
            {schema.columns.map((column) => (
              <View style={styles.tableCell}>
                <Text style={styles.tableCellText}>
                  {mapRecordValue(column, record[column])}
                </Text>
              </View>
            ))}
            {renderActions ? (
              <View style={styles.tableCell}>
                <Text style={styles.tableCellText}>
                  {renderActions(record)}
                </Text>
              </View>
            ) : null}
          </View>
        ))}
      </View>
      {view.hasMore || view.retrieving ? (
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

const styles = StyleSheet.create({
  table: {
    flexDirection: 'column',
  },
  tableHeaderRow: {
    padding: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'rgb(200, 200, 200)',
    flexDirection: 'row',
  },
  tableHeaderCell: {
    flex: 1,
  },
  tableHeaderCellText: {
    textAlign: 'center',
  },
  tableRow: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgb(220, 220, 220)',
    flexDirection: 'row',
  },
  tableCell: {
    flex: 1,
  },
  tableCellText: {
    textAlign: 'center',
  },
});
