import { DenimSchemaSource } from '.';
import { DenimDataContext } from '../core';
import DenimTableDataProvider from './DenimTableDataProvider';
import { DenimDataSourceHook } from './types/hooks';

export default abstract class DenimDataSource<T extends DenimDataContext, S extends DenimSchemaSource<T>> {
  public schemaSource: S;
  public hooks: DenimDataSourceHook<T>[];

  constructor(schema: S) {
    this.schemaSource = schema;
    this.hooks = [];
  }

  registerHook(hook: DenimDataSourceHook<T>) {
    this.hooks.push(hook);
  }

  async executeHooks<T extends any[]>(type: string, table: string, ...args: T): Promise<T> {
    const hooks = this.hooks.filter(({ type: t, table: ta }) => t === type && (typeof(ta) === 'string' ? table === ta : ta.test(table)));
    let currentArguments = args;

    for (let i = 0; i < hooks.length; i++) {
      const hook = hooks[i];
      const callback: any = hook.callback;
      currentArguments = await callback(table, ...currentArguments);
    }

    return currentArguments;
  }

  abstract createDataProvider(table: string): DenimTableDataProvider<T, S>;
}
