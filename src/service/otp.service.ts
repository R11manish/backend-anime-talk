import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { User, userSchema, UserStatus } from "../types/user.type";
import { randomUUID } from "crypto";
import { emailService } from "./email.services";
import { apiKeyService } from "./apikey.service";
import { AppError } from "../middleware/error.middleware";
import logger from "../utlis/logger";

interface OTPServiceConfig {
  length?: number;
  expiryMinutes?: number;
  tableName?: string;
}

interface VerifyOTPResult {
  verified: boolean;
  api_key?: string;
}

export class OTPService {
  private readonly otpLength: number;
  private readonly dbClient: DynamoDBClient;
  private readonly expiryMinutes: number;
  private TABLE_NAME = "users_details";

  constructor({ length = 6, expiryMinutes = 10 }: OTPServiceConfig = {}) {
    if (!process.env.CUSTOM_AWS_REGION) {
      throw new Error("AWS_REGION is not configured");
    }

    this.otpLength = length;
    this.expiryMinutes = expiryMinutes;
    this.dbClient = new DynamoDBClient({
      region: process.env.AWS_REGION,
    });
  }

  private generateOTP(length: number): string {
    return Array.from({ length }, () => Math.floor(Math.random() * 10)).join(
      ""
    );
  }

  async sendOtp(user: User): Promise<void> {
    const vuser = userSchema.parse(user);

    const otp = this.generateOTP(this.otpLength);

    const existingUser = await this.dbClient.send(
      new GetItemCommand({
        TableName: this.TABLE_NAME,
        Key: { email: { S: vuser.email } },
      })
    );

    if (!existingUser.Item) {
      await this.dbClient.send(
        new PutItemCommand({
          TableName: this.TABLE_NAME,
          Item: {
            id: { S: randomUUID() },
            name: { S: vuser.name },
            email: { S: vuser.email },
            dob: { S: vuser.dob },
            otp: { S: otp },
            gender: { S: vuser.gender },
            createdAt: { S: new Date().toISOString() },
            updatedAt: { S: new Date().toISOString() },
            user_status: { S: UserStatus.PENDING },
          },
        })
      );
    } else {
      await this.dbClient.send(
        new UpdateItemCommand({
          TableName: this.TABLE_NAME,
          Key: { email: { S: vuser.email } },
          UpdateExpression:
            "SET otp = :otp, updatedAt = :updatedAt, user_status = :user_status",
          ExpressionAttributeValues: {
            ":otp": { S: otp },
            ":updatedAt": { S: new Date().toISOString() },
            ":user_status": { S: UserStatus.PENDING },
          },
        })
      );
    }

    logger.info(`OTP generated for user: ${vuser.email}`);

    await emailService.sendTemplateEmail(vuser.email, "OTP for AnimeTalk", {
      title: `Welcome to AnimeTalk ${vuser.name}`,
      content: `Your OTP is: ${otp}`,
    });
  }

  async verifyOTP(email: string, otp: string): Promise<VerifyOTPResult> {
    const userRecord = await this.dbClient.send(
      new GetItemCommand({
        TableName: this.TABLE_NAME,
        Key: { email: { S: email } },
      })
    );

    if (!userRecord.Item) {
      throw new AppError(404, "User not found");
    }

    if (userRecord.Item?.otp?.S !== otp) {
      throw new AppError(400, "Invalid OTP");
    }

    if (userRecord.Item.updatedAt?.S) {
      const otpTime = new Date(userRecord.Item.updatedAt.S);
      const currentTime = new Date();
      const timeDifference = currentTime.getTime() - otpTime.getTime();
      const expiryTimeInMs = this.expiryMinutes * 60 * 1000;

      if (timeDifference > expiryTimeInMs) {
        throw new AppError(400, "OTP has expired. Please request a new one.");
      }
    }

    const api_key = apiKeyService.generateApiKey(userRecord.Item.email.S!);

    await this.dbClient.send(
      new UpdateItemCommand({
        TableName: this.TABLE_NAME,
        Key: { email: { S: email } },
        UpdateExpression:
          "SET updatedAt = :updatedAt, user_status = :user_status",
        ExpressionAttributeValues: {
          ":updatedAt": { S: new Date().toISOString() },
          ":user_status": { S: UserStatus.ACTIVE },
        },
      })
    );

    return { verified: true, api_key };
  }
}
