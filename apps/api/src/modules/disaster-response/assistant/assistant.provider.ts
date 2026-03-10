export interface AssistantAnswerInput {
  question: string;
  context?: {
    location?: string;
    hazardType?: string;
    userId?: string;
    demographics?: {
      age?: number | null;
      housingType?: string | null;
      personalInfo?: any;
      vulnerabilities?: any;
      householdComposition?: any;
      emergencySkills?: any;
      assets?: any;
    };
  };
}

export interface AssistantAnswerResult {
  answer: string;
  disclaimer: string;
  provider: string;
  structuredData?: {
    summary: string;
    steps: string[];
    safetyReminder: string;
  };
}

export interface DisasterAssistantProvider {
  answer(input: AssistantAnswerInput): Promise<AssistantAnswerResult>;
}
