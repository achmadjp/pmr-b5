'use client';

import { useEffect, useState } from 'react';

interface StatusData {
  status: string;
  lastUpdated: string;
}

interface HistoryItem {
  id: string;
  status: string;
  lastUpdated: string;
  createdAt: string;
}

export default function Home() {
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const [currentResponse, historyResponse] = await Promise.all([
        fetch('/api/electricity-status?type=current'),
        fetch('/api/electricity-status?type=history&limit=20')
      ]);

      if (!currentResponse.ok || !historyResponse.ok) throw new Error('Failed to fetch status');
      
      const currentData = await currentResponse.json();
      const historyData = await historyResponse.json();
      
      setStatusData(currentData);
      setHistoryData(historyData.history);
      setError(null);
    } catch {
      setError('Failed to load status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Refresh status every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'up':
        return 'bg-green-500';
      case 'down':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
          <p className="text-center text-gray-600">Loading...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
          <p className="text-center text-red-600">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Electricity Status Monitor</h1>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Current Status:</span>
            <span className={`px-4 py-2 rounded-full text-white font-semibold ${getStatusColor(statusData?.status || 'unknown')}`}>
              {statusData?.status?.toUpperCase() || 'UNKNOWN'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Last Updated:</span>
            <span className="text-gray-800">
              {statusData?.lastUpdated ? new Date(statusData.lastUpdated).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              }).replace(',', '') : 'Never'}
            </span>
          </div>
        </div>

        <button
          onClick={fetchStatus}
          className="mt-6 w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          Refresh Status
        </button>

        {/* History Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Status History</h2>
          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-[400px] overflow-y-auto">
              {historyData.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No history available</p>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {historyData.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${getStatusColor(item.status)}`}>
                            {item.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(item.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          }).replace(',', '')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
