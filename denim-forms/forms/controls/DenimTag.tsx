import React, { FunctionComponent } from 'react';
import { ColorValue, StyleSheet, Text, View, ViewProps, ViewStyle } from 'react-native';

export interface DenimTagProps {
  color: ColorValue;
  style?: ViewStyle;
}

const DenimTag: FunctionComponent<DenimTagProps> = ({
  color,
  style,
  children,
  ...props
}) => {
  return (
    <View style={[styles.container, style, { backgroundColor: color }]} {...props}>
      {children}
    </View>
  );
};

export default DenimTag;

const styles = StyleSheet.create({
  container: {
    padding: 8,
    borderRadius: 8,
  },
  text: {
    
  },
});
