import React, { useState } from 'react';
import { FunctionComponent } from 'react';
import { DenimTabControlTab } from '../../forms/controls/DenimTabControl';
import { useDenimForm } from '../../forms/providers/DenimFormProvider';

interface DenimApplicationTabControlProps {
  tabs: DenimTabControlTab[];
}

const DenimApplicationTabControl: FunctionComponent<DenimApplicationTabControlProps> = ({
  tabs,
}) => {
  const {
    componentRegistry: { tabControl: DenimTabControl },
  } = useDenimForm();
  const [tab, setTab] = useState(0);

  return <DenimTabControl tabs={tabs} tab={tab} onTabChange={setTab} />;
};

export default DenimApplicationTabControl;
