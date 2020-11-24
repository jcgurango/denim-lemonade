import { DenimDataContext, DenimRecord, DenimTableValidator } from './types/data';

export default class EmptyValidator implements DenimTableValidator {
  constructor() { }

  async validate() {
    return true;
  };
}
