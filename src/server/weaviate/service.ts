import { getWeaviateClient } from "./client";
import {
  ensureTaskCollection,
  COLLECTION_NAME,
  type TaskProperties,
} from "./schema";

export interface SimilarTask {
  ticketId: string;
  title: string;
  description: string;
  plan?: string;
  projectId: string;
  projectTitle: string;
  createdAt: string;
  similarity: number;
}

export async function findSimilarTasks(
  description: string,
  limit = 5,
  minSimilarity = 0.7,
): Promise<SimilarTask[]> {
  try {
    await ensureTaskCollection();
    const client = await getWeaviateClient();
    const collection = client.collections.get<TaskProperties>(COLLECTION_NAME);

    const result = await collection.query.nearText(description, {
      limit,
      returnMetadata: ["distance"],
    });

    if (!result?.objects) {
      return [];
    }

    return result.objects
      .map((obj) => {
        const distance = obj.metadata?.distance ?? 1;
        const similarity = 1 - distance;
        
        return {
          ticketId: obj.properties.ticketId ?? "",
          title: obj.properties.title ?? "",
          description: obj.properties.description ?? "",
          plan: obj.properties.plan,
          projectId: obj.properties.projectId ?? "",
          projectTitle: obj.properties.projectTitle ?? "",
          createdAt: obj.properties.createdAt ?? new Date().toISOString(),
          similarity,
        };
      })
      .filter((task) => task.similarity >= minSimilarity);
  } catch (error) {
    console.error("[Weaviate] Error finding similar tasks:", error);
    return [];
  }
}

export async function storeTask(task: TaskProperties): Promise<void> {
  try {
    await ensureTaskCollection();
    const client = await getWeaviateClient();
    const collection = client.collections.get<TaskProperties>(COLLECTION_NAME);

    await collection.data.insert(task);

    console.log(`[Weaviate] Stored task: ${task.ticketId} - ${task.title}`);
  } catch (error) {
    console.error("[Weaviate] Error storing task:", error);
    throw error;
  }
}

export async function updateTask(
  ticketId: string,
  updates: Partial<TaskProperties>,
): Promise<void> {
  try {
    const client = await getWeaviateClient();
    const collection = client.collections.get<TaskProperties>(COLLECTION_NAME);

    const result = await collection.query.fetchObjects({
      filters: collection.filter.byProperty("ticketId").equal(ticketId),
      limit: 1,
    });

    if (!result?.objects?.[0]) {
      console.warn(`[Weaviate] Task not found for update: ${ticketId}`);
      return;
    }

    const existingTask = result.objects[0];
    if (!existingTask.uuid) {
      console.warn(`[Weaviate] No UUID found for task: ${ticketId}`);
      return;
    }

    await collection.data.update({
      id: existingTask.uuid,
      properties: updates,
    });

    console.log(`[Weaviate] Updated task: ${ticketId}`);
  } catch (error) {
    console.error("[Weaviate] Error updating task:", error);
  }
}
