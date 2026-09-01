import React, { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api.js';
import { Settings, Save, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export const PlatformConfigPage: React.FC = () => {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  const fetchConfigs = async () => {
    setLoading(true);
    const res = await apiRequest('/admin/configs');
    if (res.success && res.data) {
      setConfigs(res.data || []);
      const initial: Record<string, string> = {};
      for (const c of res.data) {
        let v = c.valueJson;
        try {
          v = JSON.parse(c.valueJson);
        } catch {}
        initial[c.key] = typeof v === 'object' ? JSON.stringify(v) : String(v);
      }
      setInputValues(initial);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleSave = async (key: string) => {
    const rawVal = inputValues[key];
    const parsedVal = isNaN(Number(rawVal)) ? rawVal : Number(rawVal);

    setSavingKey(key);
    setMessage(null);

    const res = await apiRequest('/admin/configs', {
      method: 'POST',
      body: JSON.stringify({ key, value: parsedVal }),
    });

    if (res.success) {
      setMessage({ type: 'success', text: `Configuration "${key}" updated successfully!` });
      fetchConfigs();
    } else {
      setMessage({ type: 'error', text: res.error?.message || `Failed to update ${key}` });
    }
    setSavingKey(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            Dynamic Platform Configuration <Settings className="w-6 h-6 text-purple-400" />
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Fine-tune business logic, pricing, referral requirements, and financial rules live without downtime.
          </p>
        </div>

        <button
          onClick={fetchConfigs}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Values
        </button>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-2.5 text-xs font-semibold ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {/* Config Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {configs.map((c) => {
          return (
            <div key={c.id} className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white font-mono">{c.key}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{c.description || 'System rule parameter'}</p>
                </div>
                <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  LIVE
                </span>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={inputValues[c.key] ?? ''}
                  onChange={(e) => setInputValues({ ...inputValues, [c.key]: e.target.value })}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-emerald-400 font-mono focus:outline-none focus:border-purple-500"
                />

                <button
                  onClick={() => handleSave(c.key)}
                  disabled={savingKey === c.key}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingKey === c.key ? 'Saving...' : 'Update'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
