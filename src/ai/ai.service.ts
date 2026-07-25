import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateResultsPrompt } from './prompts/generateResults.prompt';
import { generateResultsSchema } from './prompts/generateResults.schema';
import { aiResultsDto } from './dtos/aiResults.dto';
import { AttendeeRole } from 'src/attendees/enums/attendeeRole.enum';
import { AttendeesService } from 'src/attendees/attendees.service';
import { addAttendeeDto } from 'src/attendees/dtos/addAttendee.dto';
import { ActionItemsService } from 'src/action-items/action-items.service';
import { ActionItemStatus as ActionItemStatusEnum } from 'src/action-items/enums/actionItemsStatus';
import { InjectModel } from '@nestjs/mongoose';
import { AIResults, AIResultsDocument } from './schemas/aiResults.schema';
import { Model, Types } from 'mongoose';
import { MeetingsService } from 'src/meetings/meetings.service';
import { MeetingStatus } from 'src/meetings/enums/meeting-status.enum';

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

const actionItemStatusMap: Record<ActionItemStatus, ActionItemStatusEnum> = {
  OPEN: ActionItemStatusEnum.OPEN,
  IN_PROGRESS: ActionItemStatusEnum.IN_PROGRESS,
  DONE: ActionItemStatusEnum.DONE,
  UNKNOWN: ActionItemStatusEnum.UNKNOWN,
};

@Injectable()
export class AiService {
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(
    private readonly config: ConfigService,
    @InjectModel(AIResults.name) private readonly aiResultsModel: Model<AIResultsDocument>,
    private readonly attendeesService: AttendeesService,
    private readonly actionItemsService: ActionItemsService,
    private readonly meetingsService: MeetingsService,
  ) {
    this.baseUrl = this.config.getOrThrow<string>('ai.baseUrl');
    this.model = this.config.getOrThrow<string>('ai.model');
  }

  async processAIResults(userId: string, aiInput: aiResultsDto) {
    const meeting = await this.meetingsService.findMeeting(userId, aiInput.meetingId);

    if (meeting.status === MeetingStatus.PROCESSING)
      throw new ConflictException('AI results are already being generated for this meeting.');

    const transcript = await this.meetingsService.findTranscriptByMeetingId(aiInput.meetingId);
    if (!transcript?.content.trim())
      throw new BadRequestException('This meeting has no transcript to process.');

    await this.clearAiResults(aiInput.meetingId);
    await this.meetingsService.updateStatus(aiInput.meetingId, MeetingStatus.PROCESSING);

    try {
      const results = await this.generateResults(aiInput.meetingId, transcript.content);
      await this.meetingsService.updateStatus(aiInput.meetingId, MeetingStatus.COMPLETED);
      return results;
    } catch (error) {
      await this.meetingsService.updateStatus(aiInput.meetingId, MeetingStatus.FAILED);
      throw error;
    }
  }

  private async clearAiResults(meetingId: string) {
    const keepIds = await this.actionItemsService.findManualAssigneeIds(meetingId);
    await this.actionItemsService.deleteAiGeneratedByMeetingId(meetingId);
    await this.attendeesService.deleteAiGeneratedByMeetingId(meetingId, keepIds);
    await this.aiResultsModel.deleteMany({ meetingId: new Types.ObjectId(meetingId) });
  }

  private async generateResults(meetingId: string, transcript: string) {
    let responseText: string | undefined;
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: generateResultsPrompt(transcript) }],
          format: generateResultsSchema,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama request failed with status ${response.status}`);
      }

      const data = (await response.json()) as OllamaChatResponse;
      responseText = data.message?.content;
    } catch {
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
          meetingId,
        })),
      };
    } catch {
      throw new BadGatewayException('AI service returned an invalid response.');
    }

    const attendees = await Promise.all(
      results.attendees.map((attendee) => this.upsertAttendee(meetingId, attendee)),
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
          meetingId,
          deadline: actionItem.deadline ? new Date(actionItem.deadline) : undefined,
          assigneeId: matchedAttendee?._id?.toString(),
          status: actionItemStatusMap[actionItem.status],
          aiGenerated: true,
        });
      }),
    );

    return await this.aiResultsModel.create({
      summary: results.summary,
      meetingId: new Types.ObjectId(meetingId),
      decisions: results.decisions ?? undefined,
      followUpNotes: results.followUpNotes ?? undefined,
      detailedNotes: results.detailedNotes ?? undefined,
    });
  }

  private async upsertAttendee(meetingId: string, attendee: GeneratedAttendee) {
    if (attendee.email) {
      const existingAttendee = await this.attendeesService.findAttendeeByEmail(
        meetingId,
        attendee.email,
      );
      if (existingAttendee) return existingAttendee;
    }

    return await this.attendeesService.createAttendee(attendee as addAttendeeDto);
  }

  async findAIMeetingResults(userId: string, meetingId: string) {
    await this.meetingsService.findMeeting(userId, meetingId);

    const aiResults = await this.aiResultsModel.findOne({
      meetingId: new Types.ObjectId(meetingId),
    });
    return aiResults;
  }

  async deleteByMeetingIds(meetingIds: Types.ObjectId[]) {
    await this.aiResultsModel.deleteMany({ meetingId: { $in: meetingIds } });
  }
}
