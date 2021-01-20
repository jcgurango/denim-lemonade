import React, { FunctionComponent } from 'react';
import { Text, View } from 'react-native';
import { useDenimView } from '../denim/forms';

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

export const LemonadeHeaderCell: FunctionComponent = ({ children }) => {
  return (
    <View style={{ flex: 1, paddingLeft: 8 }}>
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
    </View>
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
