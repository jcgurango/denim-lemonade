export interface DenimUser {
  id: string;
}

export interface DenimDataContext {
  user: DenimUser;
}

export interface DenimTransaction {
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
}

export interface DenimTableDataProvider {
  retrieveRecords: (context: DenimDataContext) => Promise<DenimRecord[]>;
  retrieveRecord: (context: DenimDataContext, id: string) => Promise<DenimRecord | null>;
  beginTransaction: () => Promise<DenimTransaction>;
  createRecord: (context: DenimDataContext, transaction: DenimTransaction, record: DenimRecord) => Promise<DenimRecord>;
  updateRecord: (context: DenimDataContext, transaction: DenimTransaction, id: string, record: DenimRecord) => Promise<DenimRecord>;
  validate: (context: DenimDataContext, record: DenimRecord) => Promise<Boolean>;
}

export interface DenimRecord {
  getFields: () => string[];
  getField: (name: string) => any;
}
