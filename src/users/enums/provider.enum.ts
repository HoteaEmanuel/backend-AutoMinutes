import { registerEnumType } from '@nestjs/graphql';

export enum Provider {
  LOCAL = 'local',
  GOOGLE = 'google',
}

registerEnumType(Provider, {
  name: 'MeetingStatus',
});
