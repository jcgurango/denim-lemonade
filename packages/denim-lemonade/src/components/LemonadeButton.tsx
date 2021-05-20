import React, { FunctionComponent } from 'react';
import { Button, View } from 'react-native';
import { DenimButtonProps } from 'denim/forms/controls/DenimButton';

const Colors = {
  primary: 'rgb(255, 214, 75)',
  secondary: 'rgb(75, 75, 75)',
  danger: 'red',
};

const LemonadeButton: FunctionComponent<DenimButtonProps> = ({
  id,
  text,
  type = 'primary',
  disabled,
  onPress,
}) => {
  const render = () => {
    return (
      <Button
        title={text}
        onPress={onPress}
        color={Colors[type]}
        disabled={disabled}
      />
    );
  };

  if (id === 'view.retrieve_more') {
    return (
      <View
        style={{
          width: 175,
          marginLeft: 'auto',
          marginRight: 'auto',
          marginTop: 25,
        }}
      >
        {render()}
      </View>
    );
  }

  return render();
};

export default LemonadeButton;
