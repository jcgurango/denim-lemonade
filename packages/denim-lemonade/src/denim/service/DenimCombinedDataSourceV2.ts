import { DenimRecord, DenimQuery, DenimTable } from '../core';
import DenimDataSourceV2 from './DenimDataSourceV2';

export default class DenimCombinedDataSourceV2 extends DenimDataSourceV2 {
  public dataSources: DenimDataSourceV2[];

  constructor(...dataSources: DenimDataSourceV2[]) {
    super();
    this.dataSources = dataSources;

    const tables = dataSources.reduce<DenimTable[]>((current, source) => {
      return [
        ...current,
        ...source.schema.tables,
      ];
    }, []);

    this.schema = {
      tables,
    };
  }

  findSourceByTable(table: string) {
    for (let i = 0; i < this.dataSources.length; i++) {
      const source = this.dataSources[i];

      if (source.hasTable(table)) {
        return source;
      }
    }

    throw new Error('No table found: ' + table);
  }

  protected retrieve(table: string, id: string): Promise<DenimRecord | null> {
    const source = this.findSourceByTable(table);
    return source.retrieveRecord(table, id);
  }

  protected query(table: string, query?: DenimQuery): Promise<DenimRecord[]> {
    const source = this.findSourceByTable(table);
    return source.retrieveRecords(table, query);
  }

  protected save(table: string, record: DenimRecord): Promise<DenimRecord> {
    const source = this.findSourceByTable(table);

    if (record.id) {
      return source.updateRecord(table, record.id, record);
    }

    return source.createRecord(table, record);
  }

  protected async delete(table: string, id: string): Promise<void> {
    const source = this.findSourceByTable(table);
    await source.deleteRecord(table, id);
  }
}
