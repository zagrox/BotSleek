
/**
 * DEPRECATED SERVICE
 * 
 * The logic for embedding generation and Qdrant upsert/delete has been moved 
 * to backend Directus Workflows/Flows to ensure security and centralization.
 * 
 * These functions are kept as stubs to prevent build errors in case of 
 * lingering imports, but they perform no operations.
 */

export const generateEmbedding = async (text: string): Promise<number[]> => {
  console.warn("generateEmbedding called on frontend. Logic has moved to backend flows.");
  return [];
};

export const upsertToQdrant = async (
  collectionName: string,
  points: { id: string | number; vector: number[]; payload: any }[]
): Promise<any> => {
  console.warn("upsertToQdrant called on frontend. Logic has moved to backend flows.");
  return { status: "skipped" };
};

export const deleteFromQdrant = async (collectionName: string, pointIds: (string | number)[]): Promise<any> => {
    console.warn("deleteFromQdrant called on frontend. Logic has moved to backend flows.");
    return { status: "skipped" };
};
