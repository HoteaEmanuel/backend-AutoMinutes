import { registerEnumType } from '@nestjs/graphql';

export enum ActionItemStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN PROGRESS',
  DONE = 'DONE',
  UNKNOWN = 'UNKNOWN',
}

registerEnumType(ActionItemStatus, {
  name: 'ActionItemStatus',
});
