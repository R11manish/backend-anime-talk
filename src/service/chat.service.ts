import OpenAI from "openai";
import { Messages } from "../types/chat.type";
import { SYSTEM_PROMPT } from "../constant/prompt";
import { userInfo } from "../types/user.type";

export class ChatWithCharacters {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      baseURL: "https://api.deepseek.com/v1",
      apiKey: "sk-7a4798f9e9c244f588f4f83be4b92ba4",
    });
  }

  async sendMessage(users_details: userInfo, userMessages: Array<Messages>) {
    const completion = await this.client.chat.completions.create({
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
