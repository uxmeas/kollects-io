'use client';

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PortfolioSummaryProps {
  totalCount: number;
  totalPurchasePrice: number;
  totalMarketValue: number;
  profitLoss: number;
  moments: any[];
}

export default function PortfolioSummary({ 
  totalCount, 
  totalPurchasePrice, 
  totalMarketValue, 
  profitLoss,
  moments 
}: PortfolioSummaryProps) {
  // Prepare data for pie chart (top 5 most valuable moments)
  const topMoments = moments
    .filter(m => m.marketPrice)
    .sort((a, b) => (b.marketPrice || 0) - (a.marketPrice || 0))
    .slice(0, 5)
    .map(m => ({
      name: m.player?.name || `Moment ${m.id}`,
      value: m.marketPrice || 0
    }));

  // Prepare data for profit/loss by moment
  const profitLossData = moments
    .filter(m => m.marketPrice && m.purchasePrice)
    .slice(0, 10)
    .map(m => ({
      name: `#${m.serialNumber}`,
      profit: (m.marketPrice || 0) - (m.purchasePrice || 0),
      purchase: m.purchasePrice || 0,
      market: m.marketPrice || 0
    }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-bold mb-6">Collection Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="text-center">
          <p className="text-gray-600 text-sm">Total Moments</p>
          <p className="text-3xl font-bold">{totalCount}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-600 text-sm">Total Purchase Cost</p>
          <p className="text-2xl font-bold">${(totalPurchasePrice || 0).toLocaleString()}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-600 text-sm">Current Low Ask Total</p>
          <p className="text-2xl font-bold">${(totalMarketValue || 0).toLocaleString()}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-600 text-sm">Total Difference</p>
          <p className={`text-2xl font-bold ${(profitLoss || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${Math.abs(profitLoss || 0).toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">{(profitLoss || 0) < 0 ? 'Loss' : 'Gain'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Moments by Value */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Most Valuable Moments</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={topMoments}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {topMoments.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `$${value}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Value Changes by Moment */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Value Changes by Serial</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={profitLossData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: number) => `$${value}`} />
              <Legend />
              <Bar dataKey="profit" name="Change" fill={profitLoss >= 0 ? "#00C49F" : "#FF8042"} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}