import React, { FunctionComponent } from 'react';
import styled from 'styled-components';

const DenimButtonContainer = styled.button`
  display: block;
  text-decoration: inherit;
  background-color: ${({ color }) => color};
  color: white;
`;

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
    <DenimButtonContainer
      title={text}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onPress();
      }}
      color={Colors[type]}
      disabled={disabled}
    >
      {text}
    </DenimButtonContainer>
  );
};

export default DenimButton;
