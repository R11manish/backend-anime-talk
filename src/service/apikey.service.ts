import { createHmac } from "crypto";
import { timingSafeEqual } from "crypto";

export class ApiKeyService {
  private readonly SECRET_KEY = process.env.API_KEY_SECRET!;

  generateApiKey(email: string): string {
    if (!process.env.API_KEY_SECRET) {
      throw new Error("API_KEY_SECRET is required");
    }

    const hmac = createHmac("sha256", this.SECRET_KEY)
      .update(email)
      .digest("hex");

    const token = Buffer.from(`${email}:${hmac}`).toString("base64");
    return `ak_${token}`;
  }

  validateApiKey(apiKey: string): { isValid: boolean; email?: string } {
    try {
      const token = apiKey.replace("ak_", "");

      const decoded = Buffer.from(token, "base64").toString();
      const [email, signature] = decoded.split(":");

      const expectedSignature = createHmac("sha256", this.SECRET_KEY)
        .update(email)
        .digest("hex");

      const signatureBuffer = Buffer.from(signature, "hex");
      const expectedBuffer = Buffer.from(expectedSignature, "hex");

      const isValid =
        signatureBuffer.length === expectedBuffer.length &&
        timingSafeEqual(signatureBuffer, expectedBuffer);
      return { isValid };
    } catch (error) {
      return { isValid: false };
    }
  }
}

export const apiKeyService = new ApiKeyService();
