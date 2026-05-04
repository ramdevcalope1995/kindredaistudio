'use client';

import { MCPConnector } from '@/components/MCPConnector';
import { Boxes, Database, Cpu, Settings, Globe } from 'lucide-react';

export default function ConnectorsPage() {
  return (
    <div className="h-dvh overflow-hidden bg-[#090909] text-white p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black">Connectors & Integrations</h1>
          <p className="text-white/60 mt-2">Manage connections to external services and tools</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#121212] rounded-2xl border border-white/10 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Boxes className="size-6 text-[#7c6cff]" />
                <h2 className="text-xl font-black">Model Context Protocol (MCP)</h2>
              </div>
              <p className="text-white/70 mb-4">
                Connect AI agents to your development environment using the Model Context Protocol.
                This enables real-time access to your application state, database, and development tools.
              </p>
              
              <div className="bg-[#151515] rounded-xl p-4">
                <h3 className="font-bold text-white/90 mb-2">Active Connections</h3>
                <MCPConnector />
              </div>
            </div>

            <div className="bg-[#121212] rounded-2xl border border-white/10 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Database className="size-6 text-[#23c88f]" />
                <h2 className="text-xl font-black">Database Connections</h2>
              </div>
              <p className="text-white/70 mb-4">
                Manage connections to your databases. Current connection: Neon PostgreSQL
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-[#151515] rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="font-bold">Neon PostgreSQL</span>
                  </div>
                  <div className="text-sm text-white/50">Connected</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-[#121212] rounded-2xl border border-white/10 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Settings className="size-6 text-[#ff5ea8]" />
                <h2 className="text-xl font-black">Quick Actions</h2>
              </div>
              <div className="space-y-3">
                <button className="w-full text-left p-3 bg-[#151515] rounded-lg hover:bg-[#181818] transition">
                  Test All Connections
                </button>
                <button className="w-full text-left p-3 bg-[#151515] rounded-lg hover:bg-[#181818] transition">
                  Refresh Configuration
                </button>
                <button className="w-full text-left p-3 bg-[#151515] rounded-lg hover:bg-[#181818] transition">
                  Export Configuration
                </button>
              </div>
            </div>

            <div className="bg-[#121212] rounded-2xl border border-white/10 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Cpu className="size-6 text-[#ff7a18]" />
                <h2 className="text-xl font-black">AI Services</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-[#151515] rounded-lg">
                  <span>Anthropic Claude</span>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#151515] rounded-lg">
                  <span>E2B Code Sandbox</span>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
              </div>
            </div>

            <div className="bg-[#121212] rounded-2xl border border-white/10 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Globe className="size-6 text-[#4c45a0]" />
                <h2 className="text-xl font-black">External APIs</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-[#151515] rounded-lg">
                  <span>ElevenLabs TTS</span>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#151515] rounded-lg">
                  <span>Deepgram STT</span>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}