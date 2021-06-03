import React, { FunctionComponent } from 'react';
import {
  DenimApplicationButton,
  DenimApplicationField,
  DenimApplicationForm,
  DenimApplicationLayout,
  DenimApplicationView,
  useDenimApplication,
} from 'denim-forms';
import { evaluateSchema } from 'denim';
import { dataSource } from '../Data';

const ComponentRenderer: FunctionComponent<{
  id: string;
  type: string;
  schema: any;
}> = ({ id, type, schema }) => {
  const application = useDenimApplication();
  const evaluatedSchema = evaluateSchema(schema, application);

  if (type === 'form-provider') {
    const table = dataSource.getTable(evaluatedSchema.table);

    return (
      <DenimApplicationForm
        table={table.name}
        record={evaluatedSchema.record}
        showSave={evaluatedSchema.showSave}
        onSave={(record) => {
          const evaluatedSchema = evaluateSchema(schema, {
            ...application,
            record,
          });

          if (evaluatedSchema.onSave) {
            evaluatedSchema.onSave();
          }
        }}
      >
        {schema.children.map((child: any) => (
          <ComponentRenderer
            key={child.id}
            id={child.id}
            type={child.type}
            schema={child.schema}
          />
        ))}
      </DenimApplicationForm>
    );
  }

  if (type === 'custom-content') {
    return (
      <span
        dangerouslySetInnerHTML={{
          __html: evaluatedSchema.html,
        }}
      />
    );
  }

  if (type === 'form-field') {
    const schema = {
      ...evaluatedSchema.schema,
      controlProps: {
        ...(evaluatedSchema.schema || {}),
        disabled: evaluatedSchema.readonly,
      },
    };

    return <DenimApplicationField schema={schema} />;
  }

  if (type === 'layout') {
    return (
      <DenimApplicationLayout
        flowDirection={evaluatedSchema.flowDirection}
        content={(evaluatedSchema.children || []).map((child: any) => (
          <ComponentRenderer
            key={child.id}
            id={child.id}
            type={child.type}
            schema={child.schema}
          />
        ))}
      />
    );
  }

  if (type === 'button') {
    return (
      <DenimApplicationButton
        text={evaluatedSchema.text}
        action={evaluatedSchema.action}
        iconOnly={evaluatedSchema.iconOnly}
        icon={evaluatedSchema.icon}
        inline={evaluatedSchema.inline}
        type={evaluatedSchema.type}
      />
    );
  }

  if (type === 'grid-view') {
    let actions = undefined;

    if (evaluatedSchema.actions && evaluatedSchema.actions.length) {
      actions = (
        <>
          {(evaluatedSchema.actions || []).map((child: any) => (
            <ComponentRenderer
              key={child.id}
              id={child.id}
              type={child.type}
              schema={child.schema}
            />
          ))}
        </>
      );
    }

    return (
      <DenimApplicationView
        table={evaluatedSchema.table}
        columns={evaluatedSchema.columns}
        actions={actions}
        query={evaluatedSchema.query}
      />
    );
  }

  return null;
};

const ScreenRenderer: FunctionComponent<{ components: any[] }> = ({
  components,
}) => {
  return (
    <>
      {components.map((component) => {
        return <ComponentRenderer key={component.id} {...component} />;
      })}
    </>
  );
};

export default ScreenRenderer;
