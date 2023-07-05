export enum OpenAIModel {
  DAVINCI_TURBO = "gpt-3.5-turbo",
  TURBU_16k = "gpt-3.5-turbo-16k",
}

export interface Message {
  role: Role;
  content: string;
}

export type Role = "assistant" | "user";
