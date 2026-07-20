import { Type } from '@google/genai';

export const generateResultsSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    detailedNotes: { type: Type.STRING, nullable: true },
    decisions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      nullable: true,
    },
    actionItems: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          assignee: { type: Type.STRING, nullable: true },
          deadline: { type: Type.STRING, nullable: true },
          status: {
            type: Type.STRING,
            enum: ['OPEN', 'IN_PROGRESS', 'DONE', 'UNKNOWN'],
          },
        },
        required: ['description', 'status'],
      },
    },
    followUpNotes: { type: Type.STRING, nullable: true },
  },
  required: ['summary', 'actionItems'],
};
