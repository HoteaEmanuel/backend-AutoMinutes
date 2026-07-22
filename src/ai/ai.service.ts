import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { aiResultsDto } from './dtos/aiResults.dto';
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

interface OllamaChatResponse {
  message?: {
    content?: string;
  };
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = this.config.getOrThrow<string>('ai.baseUrl');
    this.model = this.config.getOrThrow<string>('ai.model');
  }

  async processAIResults(aiInput: aiResultsDto): Promise<GeneratedResults> {
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
    } catch (error) {
      this.logger.error('Ollama request failed', error instanceof Error ? error.stack : error);
      throw new BadGatewayException('AI processing failed. Please try again later.');
    }

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
