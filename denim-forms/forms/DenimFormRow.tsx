import React, { FunctionComponent } from 'react';
import { DenimFormRowSchema, DenimFormSchema } from 'denim';
import styled from 'styled-components';
import isMobile from './utils/isMobile';
import { useDenimForm } from './providers/DenimFormProvider';

export interface DenimFormRowProps {
  schema: DenimFormRowSchema;
  form: DenimFormSchema;
}

const RowContainer = styled.div`
  flex-direction: row;
  margin-bottom: 1.25em;

  @media screen and (max-width: 720px) {
    flex-direction: column;
  }
`;

const DenimFormRow: FunctionComponent<DenimFormRowProps> = ({
  schema,
  form,
}) => {
  const {
    componentRegistry: { control: DenimFormControl },
  } = useDenimForm();
  const mobile = isMobile();

  return (
    <RowContainer>
      {schema.controls.map((control, i) => (
        <div style={mobile ? {} : { flex: control.relativeWidth }}>
          <div
            style={{
              marginLeft: '1.25em',
              ...(!mobile && i > 0
                ? {}
                : {
                    marginLeft: 0,
                  }),
              ...(mobile && i < schema.controls.length - 1
                ? {
                    marginBottom: '0.5em',
                  }
                : {}),
            }}
          >
            <DenimFormControl schema={control} form={form} />
          </div>
        </div>
      ))}
    </RowContainer>
  );
};

export default DenimFormRow;
