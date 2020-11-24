import { DenimRecord } from '../../../core';

export interface AirTableTransactionEntry {
  type: 'create' | 'update' | 'delete';
  id?: string;
  record?: DenimRecord;
}
