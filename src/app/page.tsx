'use client';

import { useEffect, useState } from 'react';

interface StatusData {
  status: string;
  lastUpdated: string;
}

export default function Home() {
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/electricity-status');
      if (!response.ok) throw new Error('Failed to fetch status');
      const data = await response.json();
      setStatusData(data);
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
              {statusData?.lastUpdated ? new Date(statusData.lastUpdated).toLocaleString() : 'Never'}
            </span>
          </div>
        </div>

        <button
          onClick={fetchStatus}
          className="mt-6 w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          Refresh Status
        </button>
      </div>
    </main>
  );
}
