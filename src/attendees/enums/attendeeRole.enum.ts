import { registerEnumType } from '@nestjs/graphql';

export enum AttendeeRole {
  PARTICIPANT = 'PARTICIPANT',
  ORGANIZER = 'ORGANIZER',
  UNKNOWN = 'UNKNOWN',
}

registerEnumType(AttendeeRole, {
  name: 'AttendeeRole',
});
