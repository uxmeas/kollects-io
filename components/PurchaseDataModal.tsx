'use client';

import { useState } from 'react';
import { savePurchaseData } from '@/lib/storage/purchase-data';

interface PurchaseDataModalProps {
  moment: any;
  walletAddress: string;
  onClose: () => void;
  onSave: () => void;
}

export default function PurchaseDataModal({ moment, walletAddress, onClose, onSave }: PurchaseDataModalProps) {
  const [purchasePrice, setPurchasePrice] = useState(moment.purchasePrice || '');
  const [purchaseDate, setPurchaseDate] = useState(moment.purchaseDate || '');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    if (purchasePrice && purchaseDate) {
      savePurchaseData(walletAddress, moment.id, {
        purchasePrice: parseFloat(purchasePrice),
        purchaseDate,
        notes
      });
      onSave();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Enter Purchase Data</h3>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Moment #{moment.serialNumber} - {moment.player?.name || `ID: ${moment.id}`}
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Purchase Price ($)</label>
          <input
            type="number"
            step="0.01"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Purchase Date</label>
          <input
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="e.g., Purchased from pack, marketplace, etc."
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!purchasePrice || !purchaseDate}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}