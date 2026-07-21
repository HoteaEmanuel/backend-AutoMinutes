import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { aiResultsDto } from './dto/aiResults.dto';
import { generateResultsPrompt } from './prompts/generateResults.prompt';
import { generateResultsSchema } from './prompts/generateResults.schema';

export type ActionItemStatus = 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'UNKNOWN';

export interface GeneratedActionItem {
  description: string;
  assignee: string | null;
  deadline: string | null;
  status: ActionItemStatus;
}

export interface GeneratedResults {
  summary: string;
  detailedNotes: string | null;
  decisions: string[] | null;
  actionItems: GeneratedActionItem[];
  followUpNotes: string | null;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly client: GoogleGenAI;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    this.client = new GoogleGenAI({ apiKey: this.config.getOrThrow<string>('ai.apiKey') });
    this.model = this.config.getOrThrow<string>('ai.model');
  }

  async processAIResults(aiInput: aiResultsDto): Promise<GeneratedResults> {
    let responseText: string | undefined;

    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: generateResultsPrompt(aiInput.transcript),
        config: {
          responseMimeType: 'application/json',
          responseSchema: generateResultsSchema,
        },
      });

      responseText = response.text;
    } catch (error) {
      this.logger.error('Gemini request failed', error instanceof Error ? error.stack : error);
      throw new BadGatewayException('AI processing failed. Please try again later.');
    }

    console.log('RESPONSE TEXT:', responseText);
    if (!responseText) {
      throw new BadGatewayException('AI service returned an empty response.');
    }

    try {
      return JSON.parse(responseText) as GeneratedResults;
    } catch {
      this.logger.error(`Failed to parse AI response as JSON: ${responseText}`);
      throw new BadGatewayException('AI service returned an invalid response.');
    }
  }
}
