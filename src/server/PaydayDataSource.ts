import { DenimDataContext, DenimQuery, DenimRecord, DenimTable } from '../denim/core';
import {
  DenimDataSource,
  DenimSchemaSource,
  DenimTableDataProvider,
  DenimValidator,
} from '../denim/service';
import bent from 'bent';

abstract class PayDayTableDataProvider extends DenimTableDataProvider<PaydayDataContext, PaydaySchemaSource> {
  private request(method: string, path: string, data: string) {
    bent('')
  }
}

class PayDayPayrollPeriodDataProvider extends PayDayTableDataProvider {
  protected retrieve(id: string): Promise<DenimRecord | null> {
    throw new Error('Method not implemented.');
  }

  protected query(query?: DenimQuery): Promise<DenimRecord[]> {
    throw new Error('Method not implemented.');
  }

  protected save(record: DenimRecord): Promise<DenimRecord> {
    throw new Error('Method not implemented.');
  }

  protected delete(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }  
}

export interface PaydayDataContext extends DenimDataContext {
  merchantId: string;
  merchantKey: string;
}

export class PaydaySchemaSource extends DenimSchemaSource<PaydayDataContext> {
  createValidator(table: string): DenimValidator<PaydayDataContext> {
    const tableSchema = this.findTableSchema(table);

    return new DenimValidator(tableSchema);
  }
}

export class PaydayDataSource extends DenimDataSource<
  PaydayDataContext,
  PaydaySchemaSource
> {
  createDataProvider(
    table: string,
  ): DenimTableDataProvider<PaydayDataContext, PaydaySchemaSource> {
    throw new Error('Method not implemented.');
  }
}
