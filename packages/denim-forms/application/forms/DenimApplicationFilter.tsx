import React, { useEffect, useMemo, useState } from 'react';
import { FunctionComponent } from 'react';
import {
  DenimColumn,
  DenimFormControlType,
  DenimQueryConditionGroup,
  DenimQueryOperator,
} from 'denim';
import { DenimFilterControl } from '../../forms';
import { useDenimForm } from '../../forms/providers/DenimFormProvider';
import { useDenimApplication } from '../DenimApplicationV2';
import { getControlFor } from './DenimApplicationField';

export interface DenimApplicationFilterProps {
  table: string;
  value?: DenimQueryConditionGroup;
  onChange?: (value: DenimQueryConditionGroup) => void;
  columns?: string[];
  globalSearchColumns?: string[];
  noApply?: boolean;
}

const DenimApplicationFilter: FunctionComponent<DenimApplicationFilterProps> =
  ({
    table,
    value,
    onChange = () => {},
    noApply,
    columns,
    globalSearchColumns,
  }) => {
    const {
      componentRegistry: { control: DenimFormControl },
    } = useDenimForm();
    const application = useDenimApplication();
    const tableSchema = useMemo(() => {
      const schema = application.dataSource?.getTable(table);

      if (!schema) {
        throw new Error('No data source.');
      }

      return schema;
    }, [table, application.dataSource]);
    const columnsSchema = useMemo(() => {
      return columns
        ? (columns
            .map((column) => {
              return tableSchema.columns.find(({ name }) => name === column);
            })
            .filter(Boolean) as DenimColumn[])
        : tableSchema.columns;
    }, [columns, tableSchema.columns]);
    const fieldSchema = useMemo(() => {
      return tableSchema.columns.reduce((current, column) => {
        return {
          ...current,
          [column.name]: getControlFor(column, { id: column.name }),
        };
      }, {});
    }, [tableSchema.columns]);

    const [globalSearch, setGlobalSearch] = useState(
      !!globalSearchColumns?.length
    );
    const [globalSearchText, setGlobalSearchText] = useState('');
    const [currentQueryValue, setCurrentQuery] =
      useState<DenimQueryConditionGroup>(
        value || {
          conditionType: 'group',
          type: 'AND',
          conditions: [],
        }
      );
    let currentQuery = (noApply ? value : currentQueryValue) || {
      conditionType: 'group',
      type: 'AND',
      conditions: [],
    };

    useEffect(() => {
      if (globalSearch) {
        const timeout = setTimeout(() => {
          if (globalSearchText) {
            const query: DenimQueryConditionGroup = {
              conditionType: 'group',
              type: 'OR',
              conditions:
                globalSearchColumns?.map((column) => ({
                  conditionType: 'single',
                  field: column,
                  operator: DenimQueryOperator.Contains,
                  value: globalSearchText,
                })) || [],
            };
            onChange(query);
            setCurrentQuery(query);
          } else {
            const query: DenimQueryConditionGroup = {
              conditionType: 'group',
              type: 'AND',
              conditions: [],
            };
            onChange(query);
            setCurrentQuery(query);
          }
        }, 200);

        return () => {
          clearTimeout(timeout);
        };
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [globalSearchText, globalSearch, onChange]);

    return (
      <>
        {globalSearch ? (
          <DenimFormControl
            schema={{
              id: 'search-text',
              relativeWidth: 1,
              type: DenimFormControlType.TextInput,
              hideLabel: true,
              controlProps: {
                placeholder: 'Type here to search...',
              },
            }}
            value={globalSearchText || ''}
            onChange={setGlobalSearchText}
          />
        ) : (
          <DenimFilterControl
            onChange={noApply ? onChange : setCurrentQuery}
            value={currentQuery}
            onApply={noApply ? undefined : () => onChange(currentQuery)}
            columns={columnsSchema}
            fieldControls={fieldSchema}
          />
        )}
        {globalSearchColumns?.length ? (
          <div style={{ textAlign: 'right', fontSize: 12 }}>
            <a
              href="/#"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setGlobalSearch((s) => !s);
              }}
            >
              Switch to {globalSearch ? 'Advanced Search' : 'Simple Search'}
            </a>
          </div>
        ) : null}
      </>
    );
  };

export default DenimApplicationFilter;
