'use client';

import { useState } from 'react';
import PurchaseDataModal from './PurchaseDataModal';

interface MomentListViewProps {
  moments: any[];
  walletAddress: string;
  onDataUpdate: () => void;
}

export default function MomentListView({ moments, walletAddress, onDataUpdate }: MomentListViewProps) {
  const [selectedMoment, setSelectedMoment] = useState<any>(null);

  return (
    <>
      <div className="bg-black text-green-400 font-mono text-xs overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-green-800">
            <th className="text-left p-2">SERIAL</th>
            <th className="text-left p-2">PLAYER</th>
            <th className="text-left p-2">POS</th>
            <th className="text-left p-2">TEAM</th>
            <th className="text-left p-2">PLAY</th>
            <th className="text-left p-2">SERIES</th>
            <th className="text-left p-2">PURCHASE DATE</th>
            <th className="text-right p-2">PURCHASE $</th>
            <th className="text-right p-2">LOW ASK $</th>
            <th className="text-right p-2">DIFF $</th>
            <th className="text-right p-2">DIFF %</th>
            <th className="text-center p-2">DATA</th>
            <th className="text-center p-2">ACTION</th>
          </tr>
        </thead>
        <tbody>
          {moments.map((moment, index) => {
            const diff = (moment.marketPrice || 0) - (moment.purchasePrice || 0);
            const diffPercent = moment.purchasePrice ? ((diff / moment.purchasePrice) * 100) : 0;
            
            return (
              <tr key={moment.id} className={`border-b border-green-900 hover:bg-green-950 ${index % 2 === 0 ? 'bg-gray-950' : ''}`}>
                <td className="p-2">#{moment.serialNumber || moment.id}</td>
                <td className="p-2 truncate max-w-[150px]">{moment.player?.name || 'Loading...'}</td>
                <td className="p-2">{moment.player?.position || '-'}</td>
                <td className="p-2 truncate max-w-[120px]">{moment.player?.team || '-'}</td>
                <td className="p-2 truncate max-w-[100px]">{moment.playType || '-'}</td>
                <td className="p-2">{moment.series?.replace('Series ', 'S') || '-'}</td>
                <td className="p-2">{moment.purchaseDate || '-'}</td>
                <td className="p-2 text-right">{moment.purchasePrice ? `$${moment.purchasePrice.toLocaleString()}` : '-'}</td>
                <td className="p-2 text-right text-yellow-400">{moment.marketPrice ? `$${moment.marketPrice.toLocaleString()}` : '-'}</td>
                <td className={`p-2 text-right font-bold ${diff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {moment.purchasePrice && moment.marketPrice ? `${diff >= 0 ? '+' : ''}$${diff.toLocaleString()}` : '-'}
                </td>
                <td className={`p-2 text-right font-bold ${diff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {moment.purchasePrice && moment.marketPrice ? `${diff >= 0 ? '+' : ''}${diffPercent.toFixed(1)}%` : '-'}
                </td>
                <td className="p-2 text-center">
                  <button
                    onClick={() => setSelectedMoment(moment)}
                    className="text-yellow-400 hover:text-yellow-300 underline"
                  >
                    {moment.isUserData ? 'EDIT' : 'ADD'}
                  </button>
                </td>
                <td className="p-2 text-center">
                  {moment.alldayUrl && (
                    <a 
                      href={moment.alldayUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      VIEW
                    </a>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-green-600 font-bold">
            <td colSpan={7} className="p-2 text-right">TOTALS:</td>
            <td className="p-2 text-right">
              ${moments.reduce((sum, m) => sum + (m.purchasePrice || 0), 0).toLocaleString()}
            </td>
            <td className="p-2 text-right text-yellow-400">
              ${moments.reduce((sum, m) => sum + (m.marketPrice || 0), 0).toLocaleString()}
            </td>
            <td className="p-2 text-right" colSpan={2}>
              {(() => {
                const totalDiff = moments.reduce((sum, m) => sum + ((m.marketPrice || 0) - (m.purchasePrice || 0)), 0);
                const totalPurchase = moments.reduce((sum, m) => sum + (m.purchasePrice || 0), 0);
                const totalPercent = totalPurchase ? (totalDiff / totalPurchase * 100) : 0;
                return (
                  <span className={totalDiff >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {totalDiff >= 0 ? '+' : ''}${Math.abs(totalDiff).toLocaleString()} ({totalPercent >= 0 ? '+' : ''}{totalPercent.toFixed(1)}%)
                  </span>
                );
              })()}
            </td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
    </>
  );
}