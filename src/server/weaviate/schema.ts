import weaviate from "weaviate-client";
import { getWeaviateClient } from "./client";

const COLLECTION_NAME = "Task";

export interface TaskProperties {
  ticketId: string;
  title: string;
  description: string;
  plan?: string;
  projectId: string;
  projectTitle: string;
  createdAt: string;
  [key: string]: string | undefined;
}

export async function ensureTaskCollection() {
  const client = await getWeaviateClient();

  try {
    const exists = await client.collections.exists(COLLECTION_NAME);

    if (!exists) {
      await client.collections.create({
        name: COLLECTION_NAME,
        description: "Tasks and their plans for similarity search",
        vectorizers: weaviate.configure.vectorizer.text2VecOpenAI({
          model: "text-embedding-3-small",
        }),
        properties: [
          {
            name: "ticketId",
            dataType: weaviate.configure.dataType.TEXT,
            description: "Unique identifier for the ticket",
            skipVectorization: true,
          },
          {
            name: "title",
            dataType: weaviate.configure.dataType.TEXT,
            description: "Title of the task",
          },
          {
            name: "description",
            dataType: weaviate.configure.dataType.TEXT,
            description: "Description of the task",
          },
          {
            name: "plan",
            dataType: weaviate.configure.dataType.TEXT,
            description: "Generated plan for the task",
          },
          {
            name: "projectId",
            dataType: weaviate.configure.dataType.TEXT,
            description: "Project identifier",
            skipVectorization: true,
          },
          {
            name: "projectTitle",
            dataType: weaviate.configure.dataType.TEXT,
            description: "Title of the project",
          },
          {
            name: "createdAt",
            dataType: weaviate.configure.dataType.DATE,
            description: "When the task was created",
            skipVectorization: true,
          },
        ],
      });
      console.log(`[Weaviate] Created collection: ${COLLECTION_NAME}`);
    }
  } catch (error) {
    console.error("[Weaviate] Error ensuring task collection:", error);
    throw error;
  }
}

export { COLLECTION_NAME };
