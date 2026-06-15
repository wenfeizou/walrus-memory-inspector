import type { ArtifactType, WalrusArtifact } from "./types";

const encoder = new TextEncoder();
const publisherUrl =
  import.meta.env.VITE_WALRUS_PUBLISHER_URL?.replace(/\/$/, "") || "https://publisher.walrus-testnet.walrus.space";
const aggregatorUrl =
  import.meta.env.VITE_WALRUS_AGGREGATOR_URL?.replace(/\/$/, "") || "https://aggregator.walrus-testnet.walrus.space";
const uploadTimeoutMs = Number(import.meta.env.VITE_WALRUS_UPLOAD_TIMEOUT_MS ?? 10000);
const uploadMode = "browser-direct";

type WalrusStoreResponse = {
  newlyCreated?: {
    blobObject?: {
      id?: string;
      blobId?: string;
    };
  };
  alreadyCertified?: {
    blobId?: string;
    event?: {
      blobId?: string;
    };
  };
};

async function sha256(input: string): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(input));
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function shortId(seed: string): string {
  return seed.slice(0, 12);
}

function extractBlobId(response: WalrusStoreResponse): string | undefined {
  return response.newlyCreated?.blobObject?.blobId ?? response.alreadyCertified?.blobId ?? response.alreadyCertified?.event?.blobId;
}

function extractObjectId(response: WalrusStoreResponse): string | undefined {
  return response.newlyCreated?.blobObject?.id;
}

async function storeOnWalrus(type: ArtifactType, content: string): Promise<Pick<WalrusArtifact, "blobId" | "objectId" | "url">> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), uploadTimeoutMs);
  const response = await fetch(`${publisherUrl}/v1/blobs`, {
    method: "PUT",
    headers: {
      "content-type": "application/json"
    },
    signal: controller.signal,
    body: JSON.stringify({
      type,
      content,
      storedAt: new Date().toISOString()
    })
  }).finally(() => window.clearTimeout(timeout));

  if (!response.ok) {
    throw new Error(`Walrus publisher returned ${response.status}`);
  }

  const data = (await response.json()) as WalrusStoreResponse;
  const blobId = extractBlobId(data);
  if (!blobId) {
    throw new Error("Walrus publisher response did not include a blob ID");
  }

  return {
    blobId,
    objectId: extractObjectId(data),
    url: `${aggregatorUrl}/v1/blobs/${blobId}`
  };
}

function formatUploadError(error: unknown): string {
  if (error instanceof DOMException && error.name === "AbortError") {
    return `Upload timed out after ${uploadTimeoutMs}ms`;
  }
  if (error instanceof Error) return error.message;
  return "Unknown upload error";
}

export async function storeArtifact(type: ArtifactType, content: string): Promise<WalrusArtifact> {
  const createdAt = new Date().toISOString();
  const contentHash = await sha256(`${type}:${content}`);
  const preview = content.slice(0, 220);
  const startedAt = performance.now();

  try {
    const stored = await storeOnWalrus(type, content);
    const durationMs = Math.round(performance.now() - startedAt);
    return {
      ...stored,
      type,
      contentHash,
      createdAt,
      preview,
      storage: "walrus",
      diagnostics: {
        mode: uploadMode,
        publisherUrl,
        aggregatorUrl,
        uploadTimeoutMs,
        durationMs,
        ok: true
      }
    };
  } catch (error) {
    console.warn("Falling back to local demo artifact storage.", error);
    const durationMs = Math.round(performance.now() - startedAt);
    const blobId = `walrus-demo-${shortId(await sha256(`${type}:${content}:${Date.now()}`))}`;
    return {
      blobId,
      type,
      contentHash,
      createdAt,
      preview,
      storage: "local-demo",
      diagnostics: {
        mode: uploadMode,
        publisherUrl,
        aggregatorUrl,
        uploadTimeoutMs,
        durationMs,
        ok: false,
        error: formatUploadError(error)
      }
    };
  }
}
