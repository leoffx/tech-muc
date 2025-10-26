/* eslint-disable @typescript-eslint/no-unsafe-argument */
import weaviate from "weaviate-client";
import type { WeaviateClient } from "weaviate-client";
import { env } from "~/env";

let client: WeaviateClient | null = null;

export async function getWeaviateClient(): Promise<WeaviateClient> {
  if (client) {
    return client;
  }

  const clusterUrl = env.WEAVIATE_HOST!;
  const apiKey = env.WEAVIATE_API_KEY!;

  client = await weaviate.connectToWeaviateCloud(clusterUrl, {
    authCredentials: new weaviate.ApiKey(apiKey),
    headers: {
      "X-OpenAI-Api-Key": env.OPENAI_API_KEY,
    },
  });

  return client;
}

export function closeWeaviateClient() {
  client = null;
}
