import * as fcl from "@onflow/fcl";
import { GET_NFL_MOMENTS, GET_MOMENT_METADATA } from "./scripts";
import { isValidFlowAddress } from "./config";

export interface NFLMoment {
  id: string;
  playID: string;
  serialNumber: string;
  mintingDate?: string;
  // Additional fields from marketplace
  playerName?: string;
  teamName?: string;
  playType?: string;
  series?: string;
  floorPrice?: number;
}

export async function fetchNFLMoments(address: string): Promise<string[]> {
  if (!isValidFlowAddress(address)) {
    throw new Error("Invalid Flow address format");
  }

  try {
    const momentIDs = await fcl.query({
      cadence: GET_NFL_MOMENTS,
      args: (arg: any, t: any) => [arg(address, t.Address)]
    });

    return momentIDs || [];
  } catch (error) {
    console.error("Error fetching NFL moments:", error);
    return [];
  }
}

export async function fetchMomentMetadata(
  address: string, 
  momentId: string
): Promise<NFLMoment | null> {
  try {
    const metadata = await fcl.query({
      cadence: GET_MOMENT_METADATA,
      args: (arg: any, t: any) => [
        arg(address, t.Address),
        arg(momentId, t.UInt64)
      ]
    });

    if (!metadata) return null;

    return {
      id: metadata.id,
      playID: metadata.playID,
      serialNumber: metadata.serialNumber,
      mintingDate: metadata.mintingDate
    };
  } catch (error) {
    console.error("Error fetching moment metadata:", error);
    return null;
  }
}

// Fetch all moments with metadata for a wallet
export async function fetchWalletCollection(address: string): Promise<NFLMoment[]> {
  const momentIDs = await fetchNFLMoments(address);
  
  if (momentIDs.length === 0) {
    return [];
  }

  // Fetch metadata for each moment (batch in groups to avoid rate limits)
  const moments: NFLMoment[] = [];
  const batchSize = 10;
  
  for (let i = 0; i < momentIDs.length; i += batchSize) {
    const batch = momentIDs.slice(i, i + batchSize);
    const batchPromises = batch.map(id => fetchMomentMetadata(address, id));
    const batchResults = await Promise.all(batchPromises);
    
    batchResults.forEach(moment => {
      if (moment) moments.push(moment);
    });
    
    // Small delay between batches to avoid rate limiting
    if (i + batchSize < momentIDs.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return moments;
}