export const generateResultsSchema = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    detailedNotes: { type: ['string', 'null'] },
    decisions: {
      type: ['array', 'null'],
      items: { type: 'string' },
    },
    actionItems: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          assignee: { type: ['string', 'null'] },
          deadline: { type: ['string', 'null'] },
          status: {
            type: 'string',
            enum: ['OPEN', 'IN_PROGRESS', 'DONE', 'UNKNOWN'],
          },
        },
        required: ['description', 'status'],
      },
    },
    followUpNotes: { type: ['string', 'null'] },
    attendees: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: ['string', 'null'] },
          role: {
            type: 'string',
            enum: ['PARTICIPANT', 'ORGANIZER', 'UNKNOWN'],
          },
        },
        required: ['name', 'role'],
      },
    },
  },
  required: ['summary', 'actionItems', 'attendees'],
};
