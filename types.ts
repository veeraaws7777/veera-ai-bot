
export enum Role {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export interface MessagePart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface Message {
  id: string;
  role: Role;
  parts: MessagePart[];
  timestamp: number;
  isStreaming?: boolean;
  groundingSources?: GroundingSource[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  createdAt: number;
}

export interface ChatSettings {
  model: string;
  useSearch: boolean;
  useThinking: boolean;
  thinkingBudget: number;
}
