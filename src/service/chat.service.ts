import OpenAI from "openai";
import { Messages } from "../types/chat.type";
import { SYSTEM_PROMPT } from "../constant/prompt";
import { userInfo } from "../types/user.type";
import "dotenv/config";

export class ChatWithCharacters {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      baseURL: "https://api.deepseek.com/v1",
      apiKey: process.env.DEEPSEEK_API,
    });
  }

  async sendMessage(users_details: userInfo, userMessages: Array<Messages>) {
    const completion = await this.client.chat.completions.create({
      temperature: 1.3,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "system",
          content: `character name ${users_details.character_name} , character description ${users_details.char_desc}  user details :  user name : ${users_details.name}  gender : ${users_details.gender}`,
        },
        ...userMessages,
      ],
      model: "deepseek-chat",
    });

    return completion.choices[0].message.content;
  }
}
