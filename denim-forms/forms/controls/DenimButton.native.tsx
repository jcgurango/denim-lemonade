import React, { FunctionComponent } from 'react';
import { Button } from 'react-native';

export interface DenimButtonProps {
  text: string;
  type?: 'primary' | 'secondary' | 'danger';
  id?: string;
  disabled?: boolean;
  onPress: () => void;
}

const Colors = {
  primary: undefined,
  secondary: 'rgb(75, 75, 75)',
  danger: 'red',
};

const DenimButton: FunctionComponent<DenimButtonProps> = ({
  text,
  type = 'primary',
  disabled,
  onPress,
}) => {
  return (
    <Button
      title={text}
      onPress={onPress}
      color={Colors[type]}
      disabled={disabled}
    />
  );
};

export default DenimButton;
