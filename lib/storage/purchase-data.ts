// Local storage for user-entered purchase data

export interface PurchaseData {
  momentId: string;
  purchasePrice: number;
  purchaseDate: string;
  notes?: string;
}

const STORAGE_KEY = 'kollects_purchase_data';

export function savePurchaseData(walletAddress: string, momentId: string, data: Partial<PurchaseData>) {
  const key = `${STORAGE_KEY}_${walletAddress}`;
  const existing = localStorage.getItem(key);
  const walletData = existing ? JSON.parse(existing) : {};
  
  walletData[momentId] = {
    ...walletData[momentId],
    ...data,
    momentId,
    updatedAt: new Date().toISOString()
  };
  
  localStorage.setItem(key, JSON.stringify(walletData));
}

export function getPurchaseData(walletAddress: string, momentId: string): PurchaseData | null {
  const key = `${STORAGE_KEY}_${walletAddress}`;
  const existing = localStorage.getItem(key);
  if (!existing) return null;
  
  const walletData = JSON.parse(existing);
  return walletData[momentId] || null;
}

export function getAllPurchaseData(walletAddress: string): Record<string, PurchaseData> {
  const key = `${STORAGE_KEY}_${walletAddress}`;
  const existing = localStorage.getItem(key);
  return existing ? JSON.parse(existing) : {};
}

export function deletePurchaseData(walletAddress: string, momentId: string) {
  const key = `${STORAGE_KEY}_${walletAddress}`;
  const existing = localStorage.getItem(key);
  if (!existing) return;
  
  const walletData = JSON.parse(existing);
  delete walletData[momentId];
  
  localStorage.setItem(key, JSON.stringify(walletData));
}