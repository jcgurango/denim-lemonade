import React, { FunctionComponent } from 'react';
import { Button } from 'react-native';

export interface DenimButtonProps {
  text: string;
  type?: 'primary' | 'secondary' | 'danger';
  id?: string;
  disabled?: boolean;
  inline?: boolean;
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
  inline,
  onPress,
}) => {
  if (inline) {
    return (
      <span
        style={{
          cursor: 'pointer',
          color: disabled ? 'rgb(180, 180, 180)' : (Colors[type] || 'blue'),
        }}
        onClick={() => {
          onPress();
        }}
      >
        {text}
      </span>
    );
  }

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
