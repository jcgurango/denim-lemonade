import { DenimColumn, DenimRecord } from '../../core';

export interface DenimWorkflow {
  name: string;
  inputs: DenimColumn[];
}

export type DenimResultAction = {
  $action: 'redirect';
  nextUrl: string;
};

export interface DenimWorkflowContext {
  executingUser?: DenimRecord;
  resultingAction?: DenimResultAction;
}
