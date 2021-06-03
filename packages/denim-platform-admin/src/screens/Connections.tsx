import React, { Fragment } from 'react';
import { FunctionComponent } from 'react';
import {
  DenimApplicationButton,
  DenimApplicationField,
  DenimApplicationForm,
  DenimApplicationLayout,
  DenimApplicationRepeater,
  DenimScreenV2,
  useDenimApplication,
  useDenimForm,
} from 'denim-forms';
import { DenimFormControlType } from 'denim';
import styled from 'styled-components';
import { CardStyle } from '../styles';
import AirTableLogo from '../images/logos/airtable.svg';

const ConnectionContainer = styled.div`
  ${CardStyle}
  margin-bottom: 1em;
`;

const ConnectionHeader = styled.div`
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding: 1em;
  display: flex;
  flex-direction: row;
  align-items: flex-end;

  .details {
    text-align: right;
    flex: 1;

    .connection-type {
      color: rgb(160, 160, 160);
    }

    .connection-name {
      font-size: 2em;
      color: rgb(80, 80, 80);
    }
  }
`;

const ConfigureContainer = styled.div`
  padding: 1em;
  text-align: right;
`;

const LogoImage = styled.img`
  height: 6em;
`;

const BaseLabel = styled.label`
  display: block;
  padding: 1em;
  ${CardStyle}
  margin-bottom: 0.5em;

  input[type='checkbox'] {
    margin-right: 0.5em;
  }
`;

const name = (type: any) => {
  if (type === 'airtable') {
    return 'AirTable';
  }

  return '';
};

const Logo: FunctionComponent<{ brand: string }> = ({ brand }) => {
  let image = null;
  let alt = '';

  if (brand === 'airtable') {
    image = AirTableLogo;
    alt = 'AirTable Connection';
  }

  if (image) {
    return <LogoImage src={image} alt={alt} />;
  }

  return null;
};

const Credentials: FunctionComponent<{}> = () => {
  const form = useDenimForm();

  if (form.getValue('type') === 'airtable') {
    const { email, password } = JSON.parse(
      form.getValue('credentials') || '{}'
    );

    return (
      <DenimApplicationLayout
        content={[
          <DenimApplicationField
            schema={{
              id: 'email',
              label: 'Email',
              type: DenimFormControlType.TextInput,
            }}
            value={email || ''}
            onChange={(email) =>
              form.setValue('credentials')(
                JSON.stringify({
                  email,
                  password,
                })
              )
            }
          />,
          <DenimApplicationField
            schema={{
              id: 'password',
              label: 'Password',
              type: DenimFormControlType.TextInput,
              controlProps: {
                secureTextEntry: true,
              },
            }}
            value={password || ''}
            onChange={(password) =>
              form.setValue('credentials')(
                JSON.stringify({
                  email,
                  password,
                })
              )
            }
          />,
        ]}
      />
    );
  }

  return null;
};

const Connection: FunctionComponent<{}> = () => {
  const application = useDenimApplication();

  return (
    <ConnectionContainer>
      <ConnectionHeader>
        <Logo brand={String(application.record?.type)} />
        <div className="details">
          <div className="connection-type">
            {name(application.record?.type)}
          </div>
          <div className="connection-name">{application.record?.name}</div>
        </div>
      </ConnectionHeader>
      <ConfigureContainer>
        <DenimApplicationButton
          type="primary"
          text="Configure"
          action={{
            link: `/connections/${application.record?.id}`,
          }}
          inline
        />
        &nbsp;
        <DenimApplicationButton
          type="danger"
          text="Delete"
          action="deleteRecord"
          inline
        />
      </ConfigureContainer>
    </ConnectionContainer>
  );
};

const Config: FunctionComponent<{}> = () => {
  const application = useDenimApplication();
  const form = useDenimForm();

  return (
    <DenimApplicationLayout
      content={[
        <h2>Configuration</h2>,
        ...(application.record?.id
          ? [
              (
                {
                  airtable: () => {
                    const {
                      bases,
                    }: {
                      bases: {
                        [key: string]: {
                          name: string;
                          category: string;
                        };
                      };
                    } = JSON.parse(form.getValue('cache') || '{}');
                    const { selectedBases = [] }: { selectedBases?: string[] } =
                      JSON.parse(
                        form.getValue('connectionConfiguration') || '{}'
                      );
                    const workspaces: { name: string; firstBase: string }[] =
                      [];

                    Object.keys(bases).forEach((baseId) => {
                      const base = bases[baseId];

                      if (
                        !workspaces.find(({ name }) => name === base.category)
                      ) {
                        workspaces.push({
                          name: base.category,
                          firstBase: baseId,
                        });
                      }
                    });

                    return (
                      <>
                        {workspaces.map((workspace) => (
                          <Fragment key={workspace.firstBase}>
                            <h3>{workspace.name}</h3>
                            {Object.keys(bases).map((baseId) => {
                              const base = bases[baseId];

                              if (base.category === workspace.name) {
                                return null;
                              }

                              return (
                                <BaseLabel>
                                  <input
                                    type="checkbox"
                                    checked={selectedBases.includes(baseId)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        form.setValue(
                                          'connectionConfiguration'
                                        )(
                                          JSON.stringify({
                                            selectedBases:
                                              selectedBases.concat(baseId),
                                          })
                                        );
                                      } else {
                                        form.setValue(
                                          'connectionConfiguration'
                                        )(
                                          JSON.stringify({
                                            selectedBases: selectedBases.filter(
                                              (base) => base !== baseId
                                            ),
                                          })
                                        );
                                      }
                                    }}
                                  />
                                  {base.name}
                                </BaseLabel>
                              );
                            })}
                          </Fragment>
                        ))}
                      </>
                    );
                  },
                } as any
              )[String(application.record?.type)](),
            ]
          : [<>Will appear on save...</>]),
      ]}
    />
  );
};

const Type: FunctionComponent<{}> = () => {
  const application = useDenimApplication();

  return (
    <DenimApplicationField
      schema={{
        id: 'type',
        controlProps: {
          disabled: !!application.record?.id,
        },
      }}
    />
  );
};

const Update: FunctionComponent<{}> = () => {
  const application = useDenimApplication();

  if (!application.record?.id) {
    return null;
  }

  return (
    <DenimApplicationField
      schema={{
        id: 'update',
      }}
    />
  );
};

const ConnectionForm: FunctionComponent<{}> = () => {
  const application = useDenimApplication();

  return (
    <DenimApplicationForm
      table="data-connections"
      record={application.routeParameters?.id}
      onSave={(record) => {
        application.navigate(`/connections/${record.id}`);
      }}
    >
      <DenimApplicationLayout
        flowDirection="row"
        content={[
          <DenimApplicationLayout
            content={[
              <DenimApplicationField
                schema={{
                  id: 'name',
                }}
              />,
              <Type />,
              <h3>Credentials</h3>,
              <Credentials />,
              <Update />,
            ]}
          />,
          {
            relativeWidth: 3,
            element: <Config />,
          },
        ]}
      />
    </DenimApplicationForm>
  );
};

const Connections: FunctionComponent<{}> = () => {
  return (
    <>
      <DenimScreenV2 id="connections" paths={['/']}>
        <DenimApplicationRepeater
          table="data-connections"
          columns={['name', 'type']}
        >
          <Connection />
        </DenimApplicationRepeater>
        <DenimApplicationButton
          text="Add New Connection"
          action={{
            link: '/connections'
          }}
        />
      </DenimScreenV2>
      <DenimScreenV2
        id="connection"
        paths={['/connections', '/connections/:id']}
      >
        <ConnectionForm />
      </DenimScreenV2>
    </>
  );
};

export default Connections;
