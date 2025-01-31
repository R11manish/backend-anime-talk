import {
  ChatCompletionAssistantMessageParam,
  ChatCompletionUserMessageParam,
} from "openai/resources";

export type Messages =
  | ChatCompletionAssistantMessageParam
  | ChatCompletionUserMessageParam;
