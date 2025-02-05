import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import {
  characterSchema,
  Character as CharacterType,
} from "../types/character.type";
import { randomUUID } from "crypto";
import { AppError } from "../middleware/error.middleware";

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

  async getAllCharacters(limit: number = 10, lastEvaluatedKey?: any) {
    try {
      const command = {
        TableName: this.TABLE_NAME,
        Limit: limit,
        FilterExpression: "feature = :featureValue",
        ExpressionAttributeValues: {
          ":featureValue": { BOOL: false },
        },
        ExclusiveStartKey: lastEvaluatedKey,
      };

      const response = await this.dbClient.send(new ScanCommand(command));

      return {
        items:
          response.Items?.map((item) => ({
            id: item.id.S,
            name: item.name.S,
            description: item.description.S,
            profileUrl: item.profileUrl.S,
            feature: item.feature.BOOL,
          })) || [],
        lastEvaluatedKey: response.LastEvaluatedKey,
      };
    } catch (error) {
      throw new AppError(500, "Failed to fetch characters");
    }
  }

  async getFeatureCharacter(limit: number = 10, lastEvaluatedKey?: any) {
    try {
      const command = {
        TableName: this.TABLE_NAME,
        Limit: limit,
        FilterExpression: "feature = :featureValue",
        ExpressionAttributeValues: {
          ":featureValue": { BOOL: true },
        },
        ExclusiveStartKey: lastEvaluatedKey,
      };

      const response = await this.dbClient.send(new ScanCommand(command));

      return {
        items:
          response.Items?.map((item) => ({
            id: item.id.S,
            name: item.name.S,
            description: item.description.S,
            profileUrl: item.profileUrl.S,
            feature: item.feature.BOOL,
          })) || [],
        lastEvaluatedKey: response.LastEvaluatedKey,
      };
    } catch (error) {
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
