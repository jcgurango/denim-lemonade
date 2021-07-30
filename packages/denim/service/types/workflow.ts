import { DenimColumn, DenimRecord } from '../../core';

export interface DenimWorkflow {
  name: string;
  inputs: DenimColumn[];
}

export type DenimResultAction = {
  $action: 'redirect';
  nextUrl: string;
} | {
  $action: 'result';
  result: any;
};

export interface DenimWorkflowContext {
  executingUser?: DenimRecord;
  resultingAction?: DenimResultAction;
}
