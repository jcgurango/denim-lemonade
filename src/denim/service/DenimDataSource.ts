import { Schema } from 'yup';
import { DenimSchemaSource } from '.';
import { DenimDataContext } from '../core';
import DenimTableDataProvider from './DenimTableDataProvider';

export default abstract class DenimDataSource<T extends DenimDataContext, S extends DenimSchemaSource<T>> {
  public schemaSource: S;

  constructor(schema: S) {
    this.schemaSource = schema;
  }

  abstract createDataProvider(table: string): DenimTableDataProvider<T, S>;
}
