import OpenAI from "openai";
import { Messages } from "../types/chat.type";
import { SYSTEM_PROMPT } from "../constant/prompt";
import { userInfo } from "../types/user.type";
import "dotenv/config";

export class ChatWithCharacters {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      baseURL: process.env.LLM_URL,
      apiKey: process.env.LLM_API,
    });
  }

  async sendMessage(users_details: userInfo, userMessages: Array<Messages>) {
    const completion = await this.client.chat.completions.create({
      temperature: 1.3,
      max_completion_tokens: 60,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "system",
          content: `character name ${users_details.character_name} , character description ${users_details.char_desc}  user details :  user name : ${users_details.name}  gender : ${users_details.gender}`,
        },
        ...userMessages,
      ],
      model: process.env.LLM_MODEL!,
    });

    return completion.choices[0].message.content;
  }
}
