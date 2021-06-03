import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FunctionComponent } from 'react';
import {
  DenimColumnType,
  DenimNotificationCodes,
  DenimQueryConditionOrGroup,
  DenimRecord,
  DenimSortExpression,
  Expansion,
} from 'denim';
import { DenimViewDataProvider } from '../../forms';
import { useDenimNotifications } from '../../forms/providers/DenimNotificationProvider';
import {
  DenimApplicationContext,
  useDenimApplication,
} from '../DenimApplicationV2';
import { DenimRelatedRecordCollection } from 'denim/core';

export interface DenimApplicationViewProviderProps {
  defaultSort?: DenimSortExpression;
  table: string;
  columns: string[];
  query?:
    | DenimQueryConditionOrGroup
    | { records: DenimRelatedRecordCollection };
  pageSize?: number;
}

const DenimApplicationViewProvider: FunctionComponent<DenimApplicationViewProviderProps> =
  ({ table, columns, defaultSort, query, pageSize = 50, children }) => {
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
          ({ name }) => name === columnName
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
        if (query && 'records' in query) {
          setRetrieving(true);

          if (query && 'records' in query && query.records) {
            const ids = query.records.records
              .filter((record) => !record.record)
              .map(({ id }) => id);
            let retrievedRecords: DenimRecord[] = [];

            if (ids.length) {
              retrievedRecords =
                (await application.dataSource?.findById(
                  table,
                  expand,
                  ...ids
                )) || [];
            }

            setRecords(
              query.records.records
                .map(({ id, record }) => {
                  if (record) {
                    return record;
                  }

                  return retrievedRecords.find(
                    ({ id: recordId }) => recordId === id
                  );
                })
                .filter(Boolean) as DenimRecord[]
            );

            setHasMore(false);
            setRetrieving(false);
          }
        } else {
          setRetrieving(true);

          try {
            const records = await application.dataSource?.retrieveRecords(
              table,
              {
                pageSize,
                page,
                expand,
                sort,
                conditions: query,
                ...(params || {}),
              }
            );

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
      ]
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
          {children}
        </DenimApplicationContext.Provider>
      </DenimViewDataProvider>
    );
  };

export default DenimApplicationViewProvider;
