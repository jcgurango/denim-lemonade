import React from 'react';
import { FunctionComponent } from 'react';
import { Link } from 'react-router-dom';
import { useDenimForm } from '../../forms/providers/DenimFormProvider';

export type DenimApplicationButtonAction = {
  link: string;
} | {
  callback: () => any;
};

export interface DenimApplicationButtonProps {
  text: string;
  action: DenimApplicationButtonAction;
}

const DenimApplicationButton: FunctionComponent<DenimApplicationButtonProps> = ({
  text,
  action,
}) => {
  const {
    componentRegistry: { button: DenimButton },
  } = useDenimForm();

  if ('link' in action) {
    return (
      <Link to={action.link} style={{ textDecoration: 'inherit' }}>
        <DenimButton text={text} onPress={() => {}} />
      </Link>
    );
  }

  if ('callback' in action) {
    return <DenimButton text={text} onPress={action.callback} />;
  }

  return <DenimButton text={text} onPress={() => {}} />;
};

export default DenimApplicationButton;
