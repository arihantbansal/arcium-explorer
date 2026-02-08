import { NextRequest } from "next/server";
import { validateCronAuth, errorResponse, jsonResponse } from "@/lib/api-helpers";
import { indexAll } from "@/lib/indexer/index-accounts";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!validateCronAuth(req)) {
    return errorResponse("Unauthorized", 401);
  }

  try {
    const devnetResults = await indexAll("devnet");

    return jsonResponse(
      {
        devnet: devnetResults,
        timestamp: new Date().toISOString(),
      },
      { network: "devnet" }
    );
  } catch (error) {
    console.error("Cron indexer error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Indexer failed",
      500
    );
  }
}

// Also support GET for Vercel Cron
export async function GET(req: NextRequest) {
  return POST(req);
}
