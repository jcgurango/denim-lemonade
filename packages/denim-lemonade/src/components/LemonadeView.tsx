import React, { FunctionComponent } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { DenimViewHeaderCellProps, useDenimView } from 'denim-forms';

export const LemonadeHeaderRow: FunctionComponent = ({ children }) => {
  return (
    <View
      style={{
        borderBottomWidth: 1,
        borderBottomColor: '#F2F3F4',
        flexDirection: 'row',
        padding: 8,
      }}
    >
      {children}
    </View>
  );
};

export const LemonadeHeaderCell: FunctionComponent<DenimViewHeaderCellProps> =
  ({ children, sortDirection, onSort = () => {}, onClearSort = () => {} }) => {
    return (
      <TouchableOpacity
        style={{
          flex: 1,
          paddingLeft: 8,
          alignItems: 'center',
          flexDirection: 'row',
        }}
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
        <Text
          style={{
            fontFamily: 'Open Sans',
            fontWeight: '600',
            fontSize: 12,
            color: '#808080',
          }}
        >
          {children === '#' ? 'Actions' : children}
        </Text>
        {sortDirection === 'ascending' ? (
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              transform: 'scaleY(-1)',
            }}
          >
            <path
              d="M5.83334 8.33333L10 12.5L14.1667 8.33333H5.83334Z"
              fill="#C2C9D1"
            />
            <path
              d="M5.83334 8.33333L10 12.5L14.1667 8.33333H5.83334Z"
              fill="black"
              fill-opacity="0.25"
            />
          </svg>
        ) : null}
        {sortDirection === 'descending' ? (
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5.83334 8.33333L10 12.5L14.1667 8.33333H5.83334Z"
              fill="#C2C9D1"
            />
            <path
              d="M5.83334 8.33333L10 12.5L14.1667 8.33333H5.83334Z"
              fill="black"
              fill-opacity="0.25"
            />
          </svg>
        ) : null}
      </TouchableOpacity>
    );
  };

export const LemonadeRow: FunctionComponent = ({ children }) => {
  const { row } = useDenimView();

  return (
    <View
      style={{
        borderBottomWidth: 1,
        borderBottomColor: '#F2F3F4',
        flexDirection: 'row',
        padding: 8,
        backgroundColor: row % 2 === 0 ? '#F9F9FA' : undefined,
      }}
    >
      {children}
    </View>
  );
};

export const LemonadeCell: FunctionComponent = ({ children }) => {
  return (
    <View style={{ flex: 1, paddingLeft: 8, paddingTop: 4, paddingBottom: 4 }}>
      <Text
        style={{
          fontFamily: 'Open Sans',
          fontWeight: 'normal',
          fontSize: 12,
          color: '#374056',
        }}
      >
        {children === '#' ? 'Actions' : children}
      </Text>
    </View>
  );
};
