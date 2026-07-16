import { registerEnumType } from '@nestjs/graphql';

export enum MeetingStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

registerEnumType(MeetingStatus, {
  name: 'MeetingStatus',
});
