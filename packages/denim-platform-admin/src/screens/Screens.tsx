import React from 'react';
import {
  useState,
  useEffect,
  useMemo,
  FunctionComponent,
  createContext,
  useCallback,
  useContext,
  useRef,
} from 'react';
import { createPortal } from 'react-dom';
import { DenimFormControlType } from 'denim';
import {
  DenimApplicationField,
  DenimApplicationForm,
  DenimApplicationLayout,
  DenimTag,
  DenimScreenV2,
  useDenimApplication,
  useDenimForm,
  DenimApplicationView,
  DenimApplicationButton,
} from 'denim-forms';
import {
  DndContext,
  useDroppable,
  useDraggable,
  useDndMonitor,
  useDndContext,
  DragEndEvent,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  closestCenter,
  DragStartEvent,
} from '@dnd-kit/core';
import styled from 'styled-components';
import randomString from 'random-string';
import { CardStyle } from '../styles';
import ConsumerSchemaProvider from '../providers/ConsumerSchemaProvider';
import FormProvider from '../components/screen/FormProvider';
import { DynamicValueProvider } from '../components/DynamicValue';
import CustomContent from '../components/screen/CustomContent';
import FormField from '../components/screen/FormField';
import Layout from '../components/screen/Layout';
import Button from '../components/screen/Button';
import GridView from '../components/screen/GridView';
import { AppSchemaFieldsProvider } from './Roles';

const Panel = styled.div`
  ${CardStyle}
  padding: 0.5em;
`;

const CanvasPanel = styled(Panel)`
  min-height: 200px;

  &:empty:before {
    display: block;
    content: 'Drag a component here to begin...';
    text-align: center;
    margin-top: 100px;
    color: rgba(0, 0, 0, 0.6);
  }
`;

const ComponentHolderContainer = styled.div`
  ${CardStyle}
  padding: 0.5em;

  &:not(:last-child) {
    margin-bottom: 1em;
  }
`;

const PrePostContainer = styled.div`
  border: 3px dashed rgb(180, 180, 180);

  &.hovered {
    border-color: green;
  }

  padding: 15px;
  margin-bottom: 1em;
`;

const DeleteContainer = styled.div`
  border: 3px dashed pink;
  color: pink;
  padding: 15px;
  margin-top: 1em;

  &.hovered {
    border-color: red;
    color: red;
  }
`;

export interface ComponentPropertiesProps<T> {
  schema: T;
  onSchemaChange: (newValue: T | ((oldValue: T) => T)) => void;
}

export interface ComponentRendererProps<T> extends ComponentPropertiesProps<T> {
  id: string;
  selected?: boolean;
  select: () => void;
}

const splitPathVariables = (path: string) => {
  return path.replace(/:[\w]+/g, '|$&|').split('|');
};

export const stripPathVariables = (paths: any) => {
  const pathVariables: string[] = [];

  paths.forEach((path: string) => {
    const regex = /:(\w+)/g;
    let match;

    // eslint-disable-next-line no-cond-assign
    while ((match = regex.exec(path))) {
      if (!pathVariables.includes(match[1])) {
        pathVariables.push(match[1]);
      }
    }
  });
  return pathVariables;
};

const Paths: FunctionComponent<{}> = () => {
  const form = useDenimForm();
  const allPaths: string[] = JSON.parse(form.getValue('paths') || '[]');
  const [newPath, setNewPath] = useState('');
  const errors: { message: string }[] = [];

  if (newPath) {
    if (newPath.indexOf('/') !== 0) {
      errors.push({
        message: 'All paths must start with a /.',
      });
    }

    if (/[^A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=]/g.exec(newPath)) {
      errors.push({
        message: 'Path contains invalid characters.',
      });
    }
  }

  return (
    <DenimApplicationField
      schema={{
        id: 'paths-control',
        type: DenimFormControlType.TextInput,
        label: 'Screen Paths',
        controlProps: {
          placeholder: 'Type a path and press enter...',
          onSubmitEditing: () => {
            if (newPath && !errors.length) {
              form.setValue('paths')(JSON.stringify(allPaths.concat(newPath)));
              setNewPath('');
            }
          },
        },
      }}
      value={newPath}
      onChange={setNewPath}
      errors={errors}
    >
      <DenimApplicationLayout
        content={allPaths.map((path) => (
          <DenimTag color="rgb(80, 80, 80)">
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <span style={{ color: 'white', flex: 1 }}>
                {splitPathVariables(path).map((part) =>
                  part.indexOf(':') === 0 ? <b>{part}</b> : part
                )}
              </span>
              <a
                href="/#"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.setValue('paths')(
                    JSON.stringify(allPaths.filter((p) => p !== path))
                  );
                }}
                style={{
                  color: 'white',
                  textDecoration: 'none',
                }}
              >
                ×
              </a>
            </div>
          </DenimTag>
        ))}
      />
    </DenimApplicationField>
  );
};

const ComponentHolder: FunctionComponent<{
  type: string;
  defaultSchema: any;
}> = ({ type, defaultSchema, children }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `default-${type}`,
    data: {
      isDefault: true,
      type,
      schema: defaultSchema,
    },
  });
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <ComponentHolderContainer
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
    >
      {children}
    </ComponentHolderContainer>
  );
};

const ComponentRenderer: FunctionComponent<{
  id: string;
  type: string;
  parentId: string;
  schema: any;
  hidePre?: boolean;
  onPreDropped: (event: DragEndEvent) => void;
  onDraggedAway: (event: DragStartEvent) => void;
  onChange: (newValue: any | ((oldValue: any) => any)) => void;
}> = ({
  id,
  type,
  parentId,
  schema,
  onChange,
  onPreDropped,
  onDraggedAway,
  hidePre,
}) => {
  const { selectedElement, select } = useContext(PropertiesPortalContext);
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
    data: {
      id,
      type,
      schema,
    },
  });
  const { isOver, setNodeRef: setPreNodeRef } = useDroppable({
    id: `pre-${id}`,
  });
  const style = {
    transform: '',
    border: '',
  };
  const selected = selectedElement === id;

  if (transform) {
    style.transform = `translate3d(${transform.x}px, ${transform.y}px, 0)`;
  }

  if (selected) {
    style.border = '2px solid green';
  }

  const { active } = useDndContext();
  const onSchemaChange = (newValue: any | ((oldValue: any) => any)) => {
    if (typeof newValue === 'function') {
      return onChange((oldSchema: any) => ({
        ...oldSchema,
        schema: newValue(oldSchema.schema),
      }));
    }

    return onChange({
      ...schema,
      schema: newValue,
    });
  };

  let content = (
    <>
      {type} {id}
    </>
  );

  if (type === 'form-provider') {
    content = (
      <FormProvider
        id={id}
        schema={schema}
        onSchemaChange={onSchemaChange}
        selected={selected}
        select={() => select(id)}
      />
    );
  }

  if (type === 'custom-content') {
    content = (
      <CustomContent
        id={id}
        schema={schema}
        onSchemaChange={onSchemaChange}
        selected={selected}
        select={() => select(id)}
      />
    );
  }

  if (type === 'form-field') {
    content = (
      <FormField
        id={id}
        schema={schema}
        onSchemaChange={onSchemaChange}
        selected={selected}
        select={() => select(id)}
      />
    );
  }

  if (type === 'layout') {
    content = (
      <Layout
        id={id}
        schema={schema}
        onSchemaChange={onSchemaChange}
        selected={selected}
        select={() => select(id)}
      />
    );
  }

  if (type === 'button') {
    content = (
      <Button
        id={id}
        schema={schema}
        onSchemaChange={onSchemaChange}
        selected={selected}
        select={() => select(id)}
      />
    );
  }

  if (type === 'grid-view') {
    content = (
      <GridView
        id={id}
        schema={schema}
        onSchemaChange={onSchemaChange}
        selected={selected}
        select={() => select(id)}
      />
    );
  }

  useDndMonitor({
    onDragStart: (event) => {
      if (event.active.id === id) {
        onDraggedAway(event);
      }
    },
    onDragEnd: (event) => {
      if (event.over?.id === `pre-${id}`) {
        setImmediate(() => {
          onPreDropped(event);
        });
      }
    },
  });

  return (
    <>
      {active && !hidePre ? (
        <PrePostContainer
          className={isOver ? 'hovered' : ''}
          ref={setPreNodeRef}
        />
      ) : null}
      <ComponentHolderContainer
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        style={style}
      >
        {content}
      </ComponentHolderContainer>
    </>
  );
};

const parseData = (data: any) => {
  const componentData = {
    ...data,
  };

  if (componentData.isDefault) {
    componentData.id = randomString({ length: 16 });
    delete componentData.isDefault;
  }

  return componentData;
};

export const Canvas: FunctionComponent<{
  id?: string;
  components?: any[];
  onChange?: (callback: (components: any[]) => any[]) => void;
  bare?: boolean;
}> = ({ id, components: passedComponents, onChange: passedOnChange, bare }) => {
  const form = useDenimForm();
  const [componentsState, setComponents] = useState<any[]>(
    JSON.parse(form.getValue('schema') || '[]')
  );
  const nodeId = id || 'root';
  const { isOver, setNodeRef } = useDroppable({
    id: nodeId,
  });
  const { active } = useDndContext();
  const [dragging, setDragging] = useState<any>(null);

  const components = passedComponents || componentsState;
  const onChange = useMemo(() => {
    return passedOnChange || setComponents;
  }, [passedOnChange]);

  useEffect(() => {
    if (nodeId === 'root') {
      form.setValue('schema')(JSON.stringify(components || []));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId, form.setValue, components]);

  useDndMonitor({
    onDragEnd: useCallback(
      (event) => {
        if (event.over?.id === nodeId) {
          const componentData = parseData(event.active.data.current);
          onChange((components) => components.concat(componentData));
        }

        setDragging(null);
      },
      [nodeId, onChange]
    ),
  });

  const content = (
    <>
      {components.map((schema: any, index: number) => {
        return (
          <ComponentRenderer
            parentId={nodeId}
            key={schema.id}
            {...schema}
            onPreDropped={(event) => {
              const componentData = parseData(event.active.data.current);

              onChange((components) => [
                ...components.slice(0, index),
                componentData,
                ...components.slice(index),
              ]);
            }}
            onDraggedAway={(event) => {
              const componentData = parseData(event.active.data.current);
              setDragging(componentData);

              onChange((components) =>
                components.filter(
                  ({ id: componentId }: { id: string }) =>
                    componentId !== schema.id
                )
              );
            }}
            onChange={(newSchema) => {
              onChange((components) =>
                components.map((component: any) => {
                  if (component.id === schema.id) {
                    if (typeof newSchema === 'function') {
                      return newSchema(schema);
                    }

                    return newSchema;
                  }

                  return component;
                })
              );
            }}
          />
        );
      })}
      {active ? (
        <PrePostContainer
          ref={setNodeRef}
          className={isOver ? 'hovered' : ''}
        />
      ) : null}
      {dragging ? (
        <ComponentRenderer
          parentId={nodeId}
          key={dragging.id}
          hidePre
          {...dragging}
        />
      ) : null}
    </>
  );

  if (bare) {
    return content;
  }

  return <CanvasPanel>{content}</CanvasPanel>;
};

const Deleter: FunctionComponent<{}> = () => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'root-delete',
  });
  const { active } = useDndContext();

  if (!active || active?.data.current?.isDefault) {
    return null;
  }

  return (
    <DeleteContainer ref={setNodeRef} className={isOver ? 'hovered' : ''}>
      Drag here to delete...
    </DeleteContainer>
  );
};

const PropertiesPortalContext = createContext<{
  portalElement?: Element;
  selectedElement?: string;
  select: (id: string) => void;
}>({
  select: () => {},
});

export const PropertiesPanel: FunctionComponent<{
  title: string;
}> = ({ title, children }) => {
  const context = useContext(PropertiesPortalContext);

  return createPortal(
    <Panel
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      <DenimApplicationLayout
        content={[<h3>{title} Properties</h3>, <>{children}</>]}
      />
    </Panel>,
    context.portalElement || document.body
  );
};

const ScreenForm: FunctionComponent<{}> = () => {
  const form = useDenimForm();
  const [selectedElement, setSelectedElement] =
    useState<string | undefined>(undefined);
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 40,
    },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      distance: 40,
    },
  });
  const keyboardSensor = useSensor(KeyboardSensor, {});
  const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor);
  const propertiesRef = useRef<any>();
  const paths = JSON.parse(form.getValue('paths') || '[]');
  const pathVariables: string[] = stripPathVariables(paths);

  return (
    <PropertiesPortalContext.Provider
      value={{
        portalElement: propertiesRef.current,
        selectedElement,
        select: (id) =>
          setSelectedElement((element) => {
            if (element === id) {
              return undefined;
            }

            return id;
          }),
      }}
    >
      <DndContext sensors={sensors} collisionDetection={closestCenter}>
        <DenimApplicationLayout
          flowDirection="row"
          content={[
            <DenimApplicationLayout
              content={[
                <Panel>
                  <DenimApplicationLayout
                    content={[
                      <h2>Screen Properties</h2>,
                      <DenimApplicationField
                        schema={{
                          id: 'name',
                        }}
                      />,
                      <DenimApplicationField
                        schema={{
                          id: 'roles',
                        }}
                      />,
                      <Paths />,
                    ]}
                  />
                </Panel>,
                <div ref={propertiesRef} />,
              ]}
            />,
            {
              relativeWidth: 2,
              element: (
                <>
                  <DynamicValueProvider
                    values={pathVariables.map((variable) => ({
                      code:
                        'return application.routeParameters["' +
                        variable +
                        '"];',
                      type: 'string',
                      arguments: [],
                      label: `"${variable}" from path`,
                    }))}
                  >
                    <Canvas />
                    <Deleter />
                  </DynamicValueProvider>
                </>
              ),
            },
            <Panel>
              <DenimApplicationLayout
                content={[
                  <h2>Components</h2>,
                  <ComponentHolder type="layout" defaultSchema={{}}>
                    Layout
                  </ComponentHolder>,
                  <ComponentHolder type="form-provider" defaultSchema={{}}>
                    Form Provider
                  </ComponentHolder>,
                  <ComponentHolder type="form-field" defaultSchema={{}}>
                    Form Field
                  </ComponentHolder>,
                  <ComponentHolder type="grid-view" defaultSchema={{}}>
                    Grid View
                  </ComponentHolder>,
                  <ComponentHolder
                    type="custom-content"
                    defaultSchema={{
                      html: "return (stringValue || '').replace(/:(\\w+)/g, (match, prop) => eval(prop));",
                      html__props: { stringValue: '<b>Some HTML here</b>' },
                    }}
                  >
                    Custom Content
                  </ComponentHolder>,
                  <ComponentHolder type="button" defaultSchema={{}}>
                    Button
                  </ComponentHolder>,
                ]}
              />
            </Panel>,
          ]}
        />
      </DndContext>
    </PropertiesPortalContext.Provider>
  );
};

const ScreenFormContainer: FunctionComponent<{}> = () => {
  const application = useDenimApplication();

  return (
    <DenimApplicationForm
      table="screens"
      onSave={(record) => {
        application.navigate(`/screen/${record.id}`);
      }}
      record={application.routeParameters?.id}
    >
      <ScreenForm />
    </DenimApplicationForm>
  );
};

const ViewActions: FunctionComponent<{}> = () => {
  const application = useDenimApplication();

  return (
    <>
      <DenimApplicationButton
        text="Edit"
        action={{
          link: `/screen/${application.record?.id}`,
        }}
        icon="pencil"
        iconOnly
      />
      <DenimApplicationButton
        text="Delete"
        action="deleteRecord"
        icon="delete"
        iconOnly
      />
    </>
  );
};

const Screens: FunctionComponent<{}> = () => {
  return (
    <>
      <DenimScreenV2 id="screen-list" paths={['/screens']}>
        <DenimApplicationLayout
          content={[
            <DenimApplicationView
              table="screens"
              columns={['name', 'roles', 'paths']}
              actions={<ViewActions />}
            />,
            <DenimApplicationButton
              text="Add New Screen"
              action={{
                link: '/screen',
              }}
            />,
          ]}
        />
      </DenimScreenV2>
      <DenimScreenV2 id="screen" paths={['/screen', '/screen/:id']}>
        <ConsumerSchemaProvider>
          <AppSchemaFieldsProvider>
            <ScreenFormContainer />
          </AppSchemaFieldsProvider>
        </ConsumerSchemaProvider>
      </DenimScreenV2>
    </>
  );
};

export default Screens;
