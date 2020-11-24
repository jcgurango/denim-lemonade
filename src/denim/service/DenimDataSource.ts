import { DenimSchema } from '../core';
import DenimTableDataProvider from './DenimTableDataProvider';

export default abstract class DenimDataSource {
  public schema: DenimSchema;

  constructor(schema: DenimSchema) {
    this.schema = schema;
  }

  abstract createDataProvider(table: string): DenimTableDataProvider;
}
