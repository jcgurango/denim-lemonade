import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ReactChild } from 'react';
import { FunctionComponent } from 'react';
import { View } from 'react-native';
import {
  DenimColumnType,
  DenimNotificationCodes,
  DenimQueryConditionOrGroup,
  DenimRecord,
  DenimSortExpression,
  Expansion,
} from '../../core';
import { DenimView, DenimViewDataProvider } from '../../forms';
import { useDenimNotifications } from '../../forms/providers/DenimNotificationProvider';
import {
  DenimApplicationContext,
  useDenimApplication,
} from '../DenimApplicationV2';

export interface DenimApplicationViewProps {
  id?: string;
  defaultSort?: DenimSortExpression;
  table: string;
  columns: string[];
  query?: DenimQueryConditionOrGroup;
  pageSize?: number;
  actions?: ReactChild;
}

const ActionsContainer: FunctionComponent<{
  record: DenimRecord;
}> = ({ record, children }) => {
  const application = useDenimApplication();

  return (
    <DenimApplicationContext.Provider
      value={{
        ...application,
        record,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-start',
        }}
      >
        {children}
      </View>
    </DenimApplicationContext.Provider>
  );
};

const DenimApplicationFilterControl: FunctionComponent<DenimApplicationViewProps> = ({
  id,
  table,
  columns,
  defaultSort,
  query,
  pageSize = 50,
  actions,
}) => {
  const application = useDenimApplication();
  const notifications = useDenimNotifications();
  const tableSchema = useMemo(() => {
    const schema = application.dataSource?.getTable(table);

    if (!schema) {
      throw new Error('No data source.');
    }

    return schema;
  }, [table, application.dataSource]);
  const expand = useMemo<Expansion>(() => {
    const expand: Expansion = [];

    columns.forEach((columnName) => {
      const column = tableSchema.columns.find(
        ({ name }) => name === columnName,
      );

      if (column && column.type === DenimColumnType.ForeignKey) {
        expand.push(columnName);
      }
    });

    return expand;
  }, [tableSchema, columns]);

  const [records, setRecords] = useState<DenimRecord[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [retrieving, setRetrieving] = useState(false);
  const [sort, setSort] = useState(defaultSort);
  const [page, setPage] = useState(1);

  const retrieveMore = useCallback(
    async (cancelled?: { isCancelled: boolean }, params?: any) => {
      setRetrieving(true);

      try {
        const records = await application.dataSource?.retrieveRecords(table, {
          pageSize,
          page,
          expand,
          sort,
          conditions: query,
          ...(params || {}),
        });

        if (records) {
          if (!cancelled?.isCancelled) {
            setRecords((r) => r.concat(records));
            setHasMore(records.length >= pageSize);
            setPage((page) => page + 1);
          }
        }
      } catch (e) {
        if (!notifications.handleError(e)) {
          notifications.notify({
            type: 'error',
            message: e.message,
            code: DenimNotificationCodes.RetrievingFailed,
          });
        }
      }

      if (!cancelled?.isCancelled) {
        setRetrieving(false);
      }
    },
    [
      table,
      application.dataSource,
      expand,
      page,
      sort,
      notifications,
      query,
      pageSize,
    ],
  );

  useEffect(() => {
    const cancelled = {
      isCancelled: false,
    };

    setRecords([]);
    setPage(1);
    retrieveMore(cancelled, {
      page: 1,
    });

    return () => {
      cancelled.isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, sort]);

  return (
    <DenimViewDataProvider
      schema={tableSchema}
      records={records}
      hasMore={hasMore}
      retrieving={retrieving}
      retrieveMore={retrieveMore}
      sort={sort}
      setSort={setSort}
      refresh={() => {
        setRecords([]);
        setPage(1);
        retrieveMore(undefined, {
          page: 1,
        });
      }}
    >
      <DenimApplicationContext.Provider
        value={{
          ...application,
          tableSchema,
        }}
      >
        <DenimView
          schema={{
            id: id || `denim-view-${table}`,
            columns,
          }}
          renderActions={
            actions
              ? (record) => (
                  <ActionsContainer record={record}>{actions}</ActionsContainer>
                )
              : undefined
          }
        />
      </DenimApplicationContext.Provider>
    </DenimViewDataProvider>
  );
};

export default DenimApplicationFilterControl;
