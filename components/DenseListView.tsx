'use client';

import { useState } from 'react';
import PurchaseDataModal from './PurchaseDataModal';

interface DenseListViewProps {
  moments: any[];
  walletAddress: string;
  onDataUpdate: () => void;
}

export default function DenseListView({ moments, walletAddress, onDataUpdate }: DenseListViewProps) {
  const [selectedMoment, setSelectedMoment] = useState<any>(null);
  const [sortBy, setSortBy] = useState<'serial' | 'fmv' | 'paid' | 'diff'>('serial');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Sort moments based on selected criteria
  const sortedMoments = [...moments].sort((a, b) => {
    let aVal, bVal;
    switch (sortBy) {
      case 'serial':
        aVal = parseInt(a.serialNumber || a.id);
        bVal = parseInt(b.serialNumber || b.id);
        break;
      case 'fmv':
        aVal = a.marketPrice || 0;
        bVal = b.marketPrice || 0;
        break;
      case 'paid':
        aVal = a.purchasePrice || 0;
        bVal = b.purchasePrice || 0;
        break;
      case 'diff':
        aVal = (a.marketPrice || 0) - (a.purchasePrice || 0);
        bVal = (b.marketPrice || 0) - (b.purchasePrice || 0);
        break;
    }
    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const handleSort = (field: 'serial' | 'fmv' | 'paid' | 'diff') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <>
      <div className="bg-black text-green-400 font-mono overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-green-800 text-xxs">
              <th className="text-left p-1 cursor-pointer hover:text-green-300" onClick={() => handleSort('serial')}>
                SERIAL {sortBy === 'serial' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-left p-1">PLAYER / MOMENT</th>
              <th className="text-left p-1">SET / SERIES</th>
              <th className="text-right p-1 cursor-pointer hover:text-green-300" onClick={() => handleSort('fmv')}>
                FMV {sortBy === 'fmv' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-right p-1 cursor-pointer hover:text-green-300" onClick={() => handleSort('paid')}>
                PAID {sortBy === 'paid' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-right p-1 cursor-pointer hover:text-green-300" onClick={() => handleSort('diff')}>
                DIFF {sortBy === 'diff' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-center p-1">BADGES</th>
              <th className="text-left p-1">ACQUIRED</th>
              <th className="text-center p-1">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {sortedMoments.map((moment, index) => {
              const diff = (moment.marketPrice || 0) - (moment.purchasePrice || 0);
              const diffPercent = moment.purchasePrice > 0 ? ((diff / moment.purchasePrice) * 100) : 0;
              const isGift = moment.purchasePrice === 0 && moment.isUserData;
              
              // Mock data for demonstration
              const totalSerials = parseInt(moment.id) % 10000 + 5000; // Total edition size
              const badges = [];
              if (parseInt(moment.serialNumber) <= 100) badges.push('LOW');
              if (parseInt(moment.serialNumber) === 1) badges.push('FIRST');
              if (moment.playType?.includes('Debut')) badges.push('DEBUT');
              if (moment.series?.includes('1')) badges.push('S1');
              
              return (
                <tr key={moment.id} className={`border-b border-green-900 hover:bg-green-950 ${index % 2 === 0 ? 'bg-gray-950' : ''}`}>
                  {/* Serial Number Column */}
                  <td className="p-1">
                    <div className="text-yellow-400 font-bold">#{moment.serialNumber || '?'}</div>
                    <div className="text-gray-500 text-xxs">of {totalSerials.toLocaleString()}</div>
                  </td>
                  
                  {/* Player/Moment Column */}
                  <td className="p-1">
                    <div className="text-white font-semibold truncate max-w-[200px]">
                      {moment.player?.name || 'Unknown Player'}
                    </div>
                    <div className="text-gray-400 text-xxs">
                      {moment.player?.position} • {moment.playType || 'Moment'}
                    </div>
                  </td>
                  
                  {/* Set/Series Column */}
                  <td className="p-1">
                    <div className="text-gray-300">{moment.player?.team || 'Team'}</div>
                    <div className="text-gray-500 text-xxs">{moment.series || 'Series'}</div>
                  </td>
                  
                  {/* FMV Column */}
                  <td className="p-1 text-right">
                    <div className="text-yellow-400 font-bold">
                      ${moment.marketPrice?.toLocaleString() || '-'}
                    </div>
                    <div className="text-gray-500 text-xxs">Low Ask</div>
                  </td>
                  
                  {/* Paid Column */}
                  <td className="p-1 text-right">
                    {moment.purchasePrice !== undefined && moment.purchasePrice !== null ? (
                      <>
                        <div className={isGift ? 'text-cyan-400' : 'text-white'}>
                          {isGift ? 'GIFT' : `$${moment.purchasePrice.toLocaleString()}`}
                        </div>
                        <div className="text-gray-500 text-xxs">
                          {moment.purchaseDate ? new Date(moment.purchaseDate).toLocaleDateString() : '-'}
                        </div>
                      </>
                    ) : (
                      <div className="text-gray-600">-</div>
                    )}
                  </td>
                  
                  {/* Difference Column */}
                  <td className="p-1 text-right">
                    {moment.purchasePrice !== undefined && moment.marketPrice && !isGift ? (
                      <>
                        <div className={`font-bold ${diff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {diff >= 0 ? '+' : ''}${Math.abs(diff).toLocaleString()}
                        </div>
                        <div className={`text-xxs ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {diffPercent >= 0 ? '+' : ''}{diffPercent.toFixed(1)}%
                        </div>
                      </>
                    ) : (
                      <div className="text-gray-600">-</div>
                    )}
                  </td>
                  
                  {/* Badges Column */}
                  <td className="p-1 text-center">
                    <div className="flex flex-wrap justify-center gap-1">
                      {badges.map(badge => (
                        <span 
                          key={badge} 
                          className="px-1 py-0.5 text-xxs bg-yellow-600 text-black rounded font-bold"
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                  </td>
                  
                  {/* Acquired Column */}
                  <td className="p-1">
                    <div className="text-gray-300 text-xxs">
                      {moment.notes || (isGift ? 'Gifted' : 'Purchased')}
                    </div>
                    {moment.transactionId && (
                      <div className="text-gray-600 text-xxs truncate max-w-[100px]">
                        TX: {moment.transactionId}
                      </div>
                    )}
                  </td>
                  
                  {/* Actions Column */}
                  <td className="p-1 text-center">
                    <button
                      onClick={() => setSelectedMoment(moment)}
                      className="text-yellow-400 hover:text-yellow-300 text-xs mr-2"
                    >
                      {moment.isUserData ? 'EDIT' : 'ADD'}
                    </button>
                    {moment.alldayUrl && (
                      <a 
                        href={moment.alldayUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-xs"
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
            <tr className="border-t-2 border-green-600 font-bold text-xs">
              <td colSpan={3} className="p-2 text-right">
                TOTALS ({moments.length} moments, {moments.filter(m => m.purchasePrice === 0 && m.isUserData).length} gifts):
              </td>
              <td className="p-2 text-right text-yellow-400">
                ${moments.reduce((sum, m) => sum + (m.marketPrice || 0), 0).toLocaleString()}
              </td>
              <td className="p-2 text-right">
                ${moments.filter(m => m.purchasePrice > 0).reduce((sum, m) => sum + m.purchasePrice, 0).toLocaleString()}
              </td>
              <td className="p-2 text-right">
                {(() => {
                  const paidMoments = moments.filter(m => m.purchasePrice > 0);
                  const totalDiff = paidMoments.reduce((sum, m) => sum + ((m.marketPrice || 0) - m.purchasePrice), 0);
                  const totalPaid = paidMoments.reduce((sum, m) => sum + m.purchasePrice, 0);
                  const totalPercent = totalPaid ? (totalDiff / totalPaid * 100) : 0;
                  return (
                    <>
                      <div className={totalDiff >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {totalDiff >= 0 ? '+' : ''}${Math.abs(totalDiff).toLocaleString()}
                      </div>
                      <div className={`text-xxs ${totalDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {totalPercent >= 0 ? '+' : ''}{totalPercent.toFixed(1)}%
                      </div>
                    </>
                  );
                })()}
              </td>
              <td colSpan={3}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Summary Stats Bar */}
      <div className="bg-gray-900 text-green-400 font-mono text-xs p-2 flex justify-between items-center">
        <div className="flex gap-4">
          <span>TOTAL MOMENTS: {moments.length}</span>
          <span>PURCHASES: {moments.filter(m => m.purchasePrice > 0).length}</span>
          <span>GIFTS: {moments.filter(m => m.purchasePrice === 0 && m.isUserData).length}</span>
        </div>
        <div className="flex gap-4">
          <span>AVG PAID: ${
            moments.filter(m => m.purchasePrice > 0).length > 0
              ? Math.round(moments.filter(m => m.purchasePrice > 0).reduce((sum, m) => sum + m.purchasePrice, 0) / moments.filter(m => m.purchasePrice > 0).length).toLocaleString()
              : '0'
          }</span>
          <span>AVG FMV: ${
            moments.filter(m => m.marketPrice).length > 0
              ? Math.round(moments.reduce((sum, m) => sum + (m.marketPrice || 0), 0) / moments.filter(m => m.marketPrice).length).toLocaleString()
              : '0'
          }</span>
        </div>
      </div>

      {selectedMoment && (
        <PurchaseDataModal
          moment={selectedMoment}
          walletAddress={walletAddress}
          onClose={() => setSelectedMoment(null)}
          onSave={() => {
            setSelectedMoment(null);
            onDataUpdate();
          }}
        />
      )}
    </>
  );
}