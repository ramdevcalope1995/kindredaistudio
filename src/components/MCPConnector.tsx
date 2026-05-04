import { useState, useEffect } from 'react';

interface MCPConfig {
  id: string;
  name: string;
  description: string;
  connected: boolean;
  lastUsed?: string;
}

export function MCPConnector() {
  const [configs, setConfigs] = useState<MCPConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    // Simulate loading configs from API
    setTimeout(() => {
      const mockConfigs: MCPConfig[] = [
        {
          id: 'next-devtools',
          name: 'Next.js DevTools',
          description: 'Access your Next.js app internals and development server',
          connected: true,
          lastUsed: 'Just now'
        },
        {
          id: 'postgres-neon',
          name: 'Neon PostgreSQL',
          description: 'Connect to your Neon database for real-time queries',
          connected: true,
          lastUsed: '5 minutes ago'
        },
        {
          id: 'anthropic',
          name: 'Anthropic Claude',
          description: 'AI model for code generation and assistance',
          connected: true,
          lastUsed: '10 minutes ago'
        },
        {
          id: 'e2b-sandbox',
          name: 'E2B Code Sandbox',
          description: 'Secure code execution environment',
          connected: true,
          lastUsed: '15 minutes ago'
        }
      ];
      setConfigs(mockConfigs);
      setLoading(false);
    }, 500);
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-4 bg-gray-700 rounded w-3/4 animate-pulse"></div>
        <div className="h-3 bg-gray-700 rounded w-1/2 animate-pulse"></div>
        <div className="h-3 bg-gray-700 rounded w-2/3 animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-white/70">Connected Services</h3>
      <div className="space-y-2">
        {configs.map((config) => (
          <div 
            key={config.id} 
            className={`border rounded-lg p-3 cursor-pointer transition-all ${
              config.connected 
                ? 'border-green-500/30 bg-green-500/5' 
                : 'border-red-500/30 bg-red-500/5'
            }`}
            onClick={() => toggleExpand(config.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  config.connected ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="font-bold text-sm">{config.name}</span>
              </div>
              <div className="text-xs text-white/50">{config.lastUsed}</div>
            </div>
            
            {expandedId === config.id && (
              <div className="mt-2 pt-2 border-t border-white/10 text-xs text-white/60">
                <p>{config.description}</p>
                <div className="mt-2 flex gap-2">
                  <button className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded">
                    Test Connection
                  </button>
                  <button className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded">
                    Configure
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}