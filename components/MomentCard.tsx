'use client';

import { useState } from 'react';

interface MomentCardProps {
  moment: any;
}

export default function MomentCard({ moment }: MomentCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div>
        {moment.imageUrl && !imageError ? (
          <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded mb-4 overflow-hidden relative">
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-600">#{moment.serialNumber || "?"}</p>
                  <p className="text-xs text-gray-500">Loading...</p>
                </div>
              </div>
            )}
            <img 
              src={moment.imageUrl} 
              alt={`${moment.player?.name || 'NFL'} moment`}
              className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                setImageLoaded(false);
              }}
            />
          </div>
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300 rounded mb-4 flex items-center justify-center">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-600">#{moment.serialNumber || "?"}</p>
              <p className="text-xs text-gray-500">Serial</p>
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          {moment.player ? (
            <>
              <h3 className="font-bold text-lg">{moment.player.name}</h3>
              <p className="text-sm text-gray-600">
                {moment.player.position} • {moment.player.team}
              </p>
              <p className="text-sm">{moment.playType}</p>
              {moment.series && (
                <p className="text-xs text-gray-500">{moment.series}</p>
              )}
              {/* Pricing Information */}
              {moment.purchasePrice !== undefined && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  {moment.purchaseDate && (
                    <div className="text-xs text-gray-500 mb-2">Purchased: {moment.purchaseDate}</div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Purchase Price:</span>
                    <span>${moment.purchasePrice}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Current Low Ask:</span>
                    <span className="font-semibold">${moment.marketPrice}</span>
                  </div>
                  {moment.marketPrice && moment.purchasePrice && (
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-600">Difference:</span>
                      <span className={`font-semibold ${(moment.marketPrice - moment.purchasePrice) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${Math.abs(moment.marketPrice - moment.purchasePrice)} {(moment.marketPrice - moment.purchasePrice) < 0 ? 'loss' : 'gain'}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          )}
          {moment.alldayUrl && (
            <a 
              href={moment.alldayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-3 text-center text-sm text-blue-500 hover:underline"
            >
              View on NFL All Day →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}