import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateResultsPrompt } from './prompts/generateResults.prompt';
import { generateResultsSchema } from './prompts/generateResults.schema';
import { aiResultsDto } from './dtos/aiResults.dto';
import { AttendeeRole } from 'src/attendees/enums/attendeeRole.enum';
import { AttendeesService } from 'src/attendees/attendees.service';
import { addAttendeeDto } from 'src/attendees/dtos/addAttendee.dto';
import { ActionItemsService } from 'src/action-items/action-items.service';

export type ActionItemStatus = 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'UNKNOWN';

export interface GeneratedActionItem {
  description: string;
  assignee: string | null;
  deadline: string | null;
  status: ActionItemStatus;
}

export interface GeneratedAttendee {
  name: string;
  email: string | null;
  role: AttendeeRole;
  aiGenerated: true;
  meetingId: string;
}

export interface GeneratedResults {
  summary: string;
  detailedNotes: string | null;
  decisions: string[] | null;
  actionItems: GeneratedActionItem[];
  followUpNotes: string | null;
  attendees: GeneratedAttendee[];
}

interface OllamaChatResponse {
  message?: {
    content?: string;
  };
}

@Injectable()
export class AiService {
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(
    private readonly config: ConfigService,
    private readonly attendeesService: AttendeesService,
    private readonly actionItemsService: ActionItemsService,
  ) {
    this.baseUrl = this.config.getOrThrow<string>('ai.baseUrl');
    this.model = this.config.getOrThrow<string>('ai.model');
  }

  async processAIResults(aiInput: aiResultsDto) {
    let responseText: string | undefined;
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: generateResultsPrompt(aiInput.transcript) }],
          format: generateResultsSchema,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama request failed with status ${response.status}`);
      }

      const data = (await response.json()) as OllamaChatResponse;
      responseText = data.message?.content;
    } catch (_error) {
      throw new BadGatewayException('AI processing failed. Please try again later.');
    }

    if (!responseText) {
      throw new BadGatewayException('AI service returned an empty response.');
    }

    let results: GeneratedResults;
    try {
      const parsed = JSON.parse(responseText) as Omit<GeneratedResults, 'attendees'> & {
        attendees: Omit<GeneratedAttendee, 'aiGenerated' | 'meetingId'>[];
      };
      results = {
        ...parsed,
        attendees: parsed.attendees.map((attendee) => ({
          ...attendee,
          aiGenerated: true,
          meetingId: aiInput.meetingId,
        })),
      };
    } catch {
      throw new BadGatewayException('AI service returned an invalid response.');
    }

    const attendees = await Promise.all(
      results.attendees.map((attendee) =>
        this.attendeesService.createAttendee(attendee as addAttendeeDto),
      ),
    );

    const normalize = (value: string) => value.trim().toLowerCase();

    await Promise.all(
      results.actionItems.map((actionItem) => {
        const matchedAttendee = actionItem.assignee
          ? attendees.find(
              (attendee) => normalize(attendee.name) === normalize(actionItem.assignee!),
            )
          : undefined;

        return this.actionItemsService.createActionItem({
          title: actionItem.description,
          meetingId: aiInput.meetingId,
          deadline: actionItem.deadline ? new Date(actionItem.deadline) : undefined,
          assigneeId: matchedAttendee?._id?.toString(),
        });
      }),
    );

    console.log('AI RESULTS: ', results);
    return results;
  }
}
