import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateResultsPrompt } from './prompts/generateResults.prompt';
import { generateResultsSchema } from './prompts/generateResults.schema';
import { aiResultsDto } from './dtos/aiResults.dto';
import { AttendeeRole } from '../attendees/enums/attendeeRole.enum';
import { AttendeesService } from '../attendees/attendees.service';
import { addAttendeeDto } from '../attendees/dtos/addAttendee.dto';
import { ActionItemsService } from '../action-items/action-items.service';
import { ActionItemStatus as ActionItemStatusEnum } from '../action-items/enums/actionItemsStatus';
import { InjectModel } from '@nestjs/mongoose';
import { AIResults, AIResultsDocument } from './schemas/aiResults.schema';
import { Model, Types } from 'mongoose';
import { MeetingsService } from '../meetings/meetings.service';
import { MeetingStatus } from '../meetings/enums/meeting-status.enum';

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

interface GroqChatResponse {
  choices?: {
    message?: {
      content?: string;
    };
  }[];
}

const actionItemStatusMap: Record<ActionItemStatus, ActionItemStatusEnum> = {
  OPEN: ActionItemStatusEnum.OPEN,
  IN_PROGRESS: ActionItemStatusEnum.IN_PROGRESS,
  DONE: ActionItemStatusEnum.DONE,
  UNKNOWN: ActionItemStatusEnum.UNKNOWN,
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly provider: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly groqApiKey?: string;
  private readonly groqModel: string;

  constructor(
    private readonly config: ConfigService,
    @InjectModel(AIResults.name) private readonly aiResultsModel: Model<AIResultsDocument>,
    private readonly attendeesService: AttendeesService,
    private readonly actionItemsService: ActionItemsService,
    private readonly meetingsService: MeetingsService,
  ) {
    this.provider = this.config.getOrThrow<string>('ai.provider');
    this.baseUrl = this.config.getOrThrow<string>('ai.baseUrl');
    this.model = this.config.getOrThrow<string>('ai.model');
    this.groqApiKey = this.config.get<string>('ai.groq.apiKey');
    this.groqModel = this.config.getOrThrow<string>('ai.groq.model');
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
      if (error instanceof HttpException) throw error;
      this.logger.error(
        `AI processing failed for meeting ${aiInput.meetingId}`,
        error instanceof Error ? error.stack : error,
      );
      throw new BadGatewayException('AI processing failed. Please try again later.');
    }
  }

  private async clearAiResults(meetingId: string) {
    const keepIds = await this.actionItemsService.findManualAssigneeIds(meetingId);
    await this.actionItemsService.deleteAiGeneratedByMeetingId(meetingId);
    await this.attendeesService.deleteAiGeneratedByMeetingId(meetingId, keepIds);
  }

  private async callOllama(meetingId: string, transcript: string): Promise<string | undefined> {
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
      return data.message?.content;
    } catch (error) {
      this.logger.error(
        `Ollama request failed for meeting ${meetingId}`,
        error instanceof Error ? error.stack : error,
      );
      throw new BadGatewayException('AI processing failed. Please try again later.');
    }
  }

  private async callGroq(meetingId: string, transcript: string): Promise<string | undefined> {
    if (!this.groqApiKey) {
      this.logger.error(`Groq request skipped for meeting ${meetingId}: GROQ_API_KEY is not set`);
      throw new BadGatewayException('AI processing failed. Please try again later.');
    }

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.groqApiKey}`,
        },
        body: JSON.stringify({
          model: this.groqModel,
          messages: [{ role: 'user', content: generateResultsPrompt(transcript) }],
          response_format: { type: 'json_object' },
          stream: false,
        }),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`Groq request failed with status ${response.status}: ${body}`);
      }

      const data = (await response.json()) as GroqChatResponse;
      return data.choices?.[0]?.message?.content;
    } catch (error) {
      this.logger.error(
        `Groq request failed for meeting ${meetingId}`,
        error instanceof Error ? error.stack : error,
      );
      throw new BadGatewayException('AI processing failed. Please try again later.');
    }
  }

  private async generateResults(meetingId: string, transcript: string) {
    const responseText =
      this.provider === 'groq'
        ? await this.callGroq(meetingId, transcript)
        : await this.callOllama(meetingId, transcript);

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
        actionItems: parsed.actionItems ?? [],
        attendees: (parsed.attendees ?? []).map((attendee) => ({
          ...attendee,
          aiGenerated: true,
          meetingId,
        })),
      };
    } catch (error) {
      this.logger.error(
        `Failed to parse AI response for meeting ${meetingId}: ${responseText}`,
        error instanceof Error ? error.stack : error,
      );
      throw new BadGatewayException('AI service returned an invalid response.');
    }

    const attendees = await Promise.all(
      results.attendees.map((attendee) => this.upsertAttendee(meetingId, attendee)),
    );

    const normalize = (value: string) => value.trim().toLowerCase();

    const namesMatch = (attendeeName: string, assigneeName: string) => {
      const attendeeNormalized = normalize(attendeeName);
      const assigneeNormalized = normalize(assigneeName);
      if (attendeeNormalized === assigneeNormalized) return true;

      const attendeeWords = attendeeNormalized.split(/\s+/);
      const assigneeWords = assigneeNormalized.split(/\s+/);
      return attendeeWords.some((word) => assigneeWords.includes(word));
    };

    await Promise.all(
      results.actionItems.map((actionItem) => {
        const matchedAttendee = actionItem.assignee
          ? attendees.find((attendee) => namesMatch(attendee.name, actionItem.assignee!))
          : undefined;

        return this.actionItemsService.createActionItemForVerifiedMeeting({
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
      generatedActionItems: results.actionItems.map((actionItem) => ({
        description: actionItem.description,
        assignee: actionItem.assignee ?? undefined,
        deadline: actionItem.deadline ?? undefined,
        status: actionItem.status,
      })),
      generatedAttendees: results.attendees.map((attendee) => ({
        name: attendee.name,
        email: attendee.email ?? undefined,
        role: attendee.role,
      })),
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

    return await this.attendeesService.createAttendeeForVerifiedMeeting(attendee as addAttendeeDto);
  }

  async findAIMeetingResults(userId: string, meetingId: string) {
    await this.meetingsService.findMeeting(userId, meetingId);

    const aiResults = await this.aiResultsModel
      .findOne({ meetingId: new Types.ObjectId(meetingId) })
      .sort({ createdAt: -1 });
    return aiResults;
  }

  async findAIResultsHistory(userId: string, meetingId: string) {
    await this.meetingsService.findMeeting(userId, meetingId);

    return await this.aiResultsModel
      .find({ meetingId: new Types.ObjectId(meetingId) })
      .sort({ createdAt: -1 });
  }

  async deleteByMeetingIds(meetingIds: Types.ObjectId[]) {
    await this.aiResultsModel.deleteMany({ meetingId: { $in: meetingIds } });
  }
}
