import React, {
  createContext,
  FunctionComponent,
  ReactChild,
  useContext,
} from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DenimColumnType, DenimRecord, DenimViewSchema } from 'denim';
import { useDenimForm } from './providers/DenimFormProvider';
import { useDenimViewData } from './providers/DenimViewDataProvider';
import { useTranslation } from './providers/TranslationProvider';

export interface DenimViewProps {
  schema: DenimViewSchema;
  renderActions?: (record: DenimRecord) => ReactChild;
}

export interface DenimViewHeaderCellProps {
  sortDirection?: 'ascending' | 'descending';
  onSort?: (ascending: boolean) => void;
  onClearSort?: () => void;
}

export const DenimViewTableContainer: FunctionComponent = ({ children }) => {
  return <View style={styles.table}>{children}</View>;
};

export const DenimViewHeaderRow: FunctionComponent = ({ children }) => {
  return <View style={styles.tableHeaderRow}>{children}</View>;
};

export const DenimViewHeaderCell: FunctionComponent<DenimViewHeaderCellProps> = ({
  children,
  sortDirection,
  onSort = () => {},
  onClearSort = () => {},
}) => {
  return (
    <TouchableOpacity
      style={styles.tableHeaderCell}
      onPress={() => {
        if (sortDirection === 'ascending') {
          onSort(false);
        } else if (sortDirection === 'descending') {
          onClearSort();
        } else {
          onSort(true);
        }
      }}
    >
      <Text style={styles.tableHeaderCellText}>{children}</Text>
    </TouchableOpacity>
  );
};

export const DenimViewRow: FunctionComponent = ({ children }) => {
  return <View style={styles.tableRow}>{children}</View>;
};

export const DenimViewCell: FunctionComponent = ({ children }) => {
  return (
    <View style={styles.tableCell}>
      <Text style={styles.tableCellText}>{children}</Text>
    </View>
  );
};

export const DenimViewActionsCell: FunctionComponent = ({ children }) => {
  return <View style={styles.tableCell}>{children}</View>;
};

const DenimViewContext = createContext<{
  row: number;
  column: number;
  columnName: string;
  record: any;
  schema?: DenimViewSchema;
}>({
  row: 0,
  column: 0,
  columnName: '',
  record: {},
});

export const useDenimView = () => useContext(DenimViewContext);

const DenimView: FunctionComponent<DenimViewProps> = ({
  schema,
  renderActions,
}) => {
  const translation = useTranslation();
  const {
    componentRegistry: {
      button: DenimButton,
      viewTable: Table,
      viewHeaderRow: HeaderRow,
      viewHeaderCell: HeaderCell,
      viewRow: Row,
      viewCell: Cell,
    },
  } = useDenimForm();
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
    <DenimViewContext.Provider
      value={{ row: 0, column: 0, columnName: '', schema, record: null }}
    >
      <Table>
        <HeaderRow>
          {schema.columns.map((column, index) => (
            <DenimViewContext.Provider
              value={{
                row: -1,
                column: index,
                columnName: column,
                schema,
                record: null,
              }}
            >
              <HeaderCell
                sortDirection={(view.sort && view.sort.column === column) ? (view.sort.ascending ? 'ascending' : 'descending') : undefined}
                onSort={(ascending) => {
                  view.setSort({
                    column,
                    ascending,
                  })
                }}
                onClearSort={() => {
                  view.setSort();
                }}
              >
                {getColumnLabel(column)}
              </HeaderCell>
            </DenimViewContext.Provider>
          ))}
          {renderActions ? (
            <DenimViewContext.Provider
              value={{
                row: -1,
                column: -1,
                columnName: 'view.actions',
                schema,
                record: null,
              }}
            >
              <HeaderCell>#</HeaderCell>
            </DenimViewContext.Provider>
          ) : null}
        </HeaderRow>
        {view.records.map((record, row) => (
          <DenimViewContext.Provider
            value={{
              row,
              column: 0,
              columnName: '',
              schema,
              record: null,
            }}
          >
            <Row>
              {schema.columns.map((column, index) => (
                <DenimViewContext.Provider
                  value={{
                    row,
                    column: index,
                    columnName: column,
                    schema,
                    record,
                  }}
                >
                  <Cell>{mapRecordValue(column, record[column])}</Cell>
                </DenimViewContext.Provider>
              ))}
              {renderActions ? (
                <DenimViewActionsCell>
                  {renderActions(record)}
                </DenimViewActionsCell>
              ) : null}
            </Row>
          </DenimViewContext.Provider>
        ))}
      </Table>
      {view.hasMore || view.retrieving ? (
        <DenimButton
          id="view.retrieve_more"
          text={translation.translate('retrieve_more', 'Show More')}
          disabled={view.retrieving}
          onPress={view.retrieveMore}
        />
      ) : null}
    </DenimViewContext.Provider>
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
    flex: 1,
  },
});
