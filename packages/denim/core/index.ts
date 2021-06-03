export * from './types/form';
export * from './types/view';
export * from './types/data';
export * from './types/schema';

export const evaluateSchema = (
  schema: any,
  application: any
) => {
  const evaluatedSchema: any = {};

  if (typeof schema !== 'object') {
    return schema;
  }

  Object.keys(schema).forEach((key) => {
    if (
      key.indexOf('__props') === -1 ||
      key.indexOf('__props') !== key.length - 7
    ) {
      if (!Array.isArray(schema[key]) && key + '__props' in schema) {
        // Evaluate the props.
        const props = evaluateSchema(schema[key + '__props'], application);
        const functionArguments = Object.keys(props);
        // eslint-disable-next-line no-new-func
        const evaluated = Function(
          'application',
          ...functionArguments,
          schema[key]
        )(application, ...functionArguments.map((arg) => props[arg]));
        evaluatedSchema[key] = evaluated;
      } else {
        if (Array.isArray(schema[key])) {
          evaluatedSchema[key] = schema[key].map((obj: any) => {
            return evaluateSchema(obj, application);
          });
        } else if (typeof schema[key] === 'object') {
          evaluatedSchema[key] = evaluateSchema(schema[key], application);
        } else {
          evaluatedSchema[key] = schema[key];
        }
      }
    }
  });

  return evaluatedSchema;
};
