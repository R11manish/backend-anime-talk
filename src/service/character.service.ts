import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
  AttributeValue,
} from "@aws-sdk/client-dynamodb";
import {
  characterSchema,
  Character as CharacterType,
} from "../types/character.type";
import { randomUUID } from "crypto";
import { AppError } from "../middleware/error.middleware";
import { downloadPicture } from "../utlis/download-image";

// Define a type for pagination token
export interface PaginationToken {
  id?: string;
  name?: string;
}

// Define a type for DynamoDB pagination key
interface DynamoDBPaginationKey {
  [key: string]: AttributeValue;
}

// Define a type for paginated response
export interface PaginatedResponse<T> {
  items: T[];
  nextPageToken?: string;
  count: number;
}

export class CharacterService {
  private readonly dbClient: DynamoDBClient;
  private TABLE_NAME = "character_details";

  constructor() {
    if (!process.env.CUSTOM_AWS_REGION) {
      throw new Error("AWS_REGION is not configured");
    }

    this.dbClient = new DynamoDBClient({
      region: process.env.AWS_REGION,
    });
  }

  async createCharacter(character: CharacterType) {
    const ch = characterSchema.parse(character);

    const existingChar = await this.dbClient.send(
      new GetItemCommand({
        TableName: this.TABLE_NAME,
        Key: { name: { S: ch.name } },
      })
    );

    if (!ch.profileUrl) {
      const { s3_url } = await downloadPicture(ch.name);
      ch.profileUrl = s3_url;
    }

    if (!existingChar.Item) {
      await this.dbClient.send(
        new PutItemCommand({
          TableName: this.TABLE_NAME,
          Item: {
            id: { S: randomUUID() },
            name: { S: ch.name },
            description: { S: ch.description },
            profileUrl: { S: ch.profileUrl },
            feature: { BOOL: false },
          },
        })
      );
    } else {
      throw new AppError(
        409,
        "Character already exist in the database , pls try with other name"
      );
    }
  }

  /**
   * Encodes a DynamoDB pagination key to a base64 string token
   */
  private encodePaginationToken(
    lastEvaluatedKey?: DynamoDBPaginationKey
  ): string | undefined {
    if (!lastEvaluatedKey) return undefined;

    try {
      return Buffer.from(JSON.stringify(lastEvaluatedKey)).toString("base64");
    } catch (error) {
      console.error("Failed to encode pagination token:", error);
      return undefined;
    }
  }

  /**
   * Decodes a base64 string token to a DynamoDB pagination key
   */
  private decodePaginationToken(
    token?: string
  ): DynamoDBPaginationKey | undefined {
    if (!token) return undefined;

    try {
      const decoded = JSON.parse(Buffer.from(token, "base64").toString());

      // Validate the structure of the decoded token
      if (typeof decoded !== "object" || decoded === null) {
        throw new Error("Invalid pagination token structure");
      }

      return decoded;
    } catch (error) {
      console.error("Failed to decode pagination token:", error);
      throw new AppError(400, "Invalid pagination token");
    }
  }

  async getAllCharacters(
    limit: number = 10,
    pageToken?: string
  ): Promise<PaginatedResponse<CharacterType>> {
    try {
      const exclusiveStartKey = this.decodePaginationToken(pageToken);

      const command = {
        TableName: this.TABLE_NAME,
        Limit: limit,
        ExclusiveStartKey: exclusiveStartKey,
      };

      const response = await this.dbClient.send(new ScanCommand(command));

      return {
        items:
          response.Items?.map((item) => ({
            id: item.id.S!,
            name: item.name.S!,
            description: item.description.S!,
            profileUrl: item.profileUrl.S!,
            feature: item.feature.BOOL!,
          })) || [],
        nextPageToken: this.encodePaginationToken(response.LastEvaluatedKey),
        count: response.Items?.length || 0,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error("Error fetching all characters:", error);
      throw new AppError(500, "Failed to fetch characters");
    }
  }

  async getFeatureCharacter(
    limit: number = 10,
    pageToken?: string
  ): Promise<PaginatedResponse<CharacterType>> {
    try {
      const exclusiveStartKey = this.decodePaginationToken(pageToken);

      const command = {
        TableName: this.TABLE_NAME,
        Limit: limit,
        FilterExpression: "feature = :featureValue",
        ExpressionAttributeValues: {
          ":featureValue": { BOOL: true },
        },
        ExclusiveStartKey: exclusiveStartKey,
      };

      const response = await this.dbClient.send(new ScanCommand(command));

      return {
        items:
          response.Items?.map((item) => ({
            id: item.id.S!,
            name: item.name.S!,
            description: item.description.S!,
            profileUrl: item.profileUrl.S!,
            feature: item.feature.BOOL!,
          })) || [],
        nextPageToken: this.encodePaginationToken(response.LastEvaluatedKey),
        count: response.Items?.length || 0,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error("Error fetching featured characters:", error);
      throw new AppError(500, "Failed to fetch featured characters");
    }
  }

  async getCharacterByName(name: string) {
    try {
      const response = await this.dbClient.send(
        new GetItemCommand({
          TableName: this.TABLE_NAME,
          Key: {
            name: { S: name },
          },
        })
      );

      if (!response.Item) {
        throw new AppError(404, "Character not found");
      }

      return {
        id: response.Item.id.S,
        name: response.Item.name.S,
        description: response.Item.description.S,
        profileUrl: response.Item.profileUrl.S,
        feature: response.Item.feature.BOOL,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, "Failed to fetch character");
    }
  }
}
