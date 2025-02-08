import logger from "./logger";
import "dotenv/config";

interface ImageDimensions {
  width: number;
  height: number;
}

interface AnimePictureResponse {
  message: string;
  cached: boolean;
  file_location: string;
  s3_url: string;
  dimensions: ImageDimensions;
}

export async function downloadPicture(
  query: string
): Promise<AnimePictureResponse> {
  if (!query) {
    throw new Error("Query parameter is required");
  }

  const apiUrl = process.env.LAMBDA_IMAGE!;

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as AnimePictureResponse;
    return data;
  } catch (error) {
    logger.error("Error fetching picture:", error);
    throw error;
  }
}
