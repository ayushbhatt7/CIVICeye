import { useState } from 'react';
import type { Complaint, EvidenceFile } from '../types';
import { StatusBadge, UrgencyBadge } from './ui/StatusBadge';
import { PriorityMeter } from './ui/PriorityMeter';
import { SlaTimer } from './ui/SlaTimer';
import { CATEGORY_META } from '../data/mockData';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import type { DashboardStats } from '../types';

interface Props {
  complaints: Complaint[];
  stats: DashboardStats;
  onLogout: () => void;
  onViewComplaint: (id: string) => void;
  onUpdateStatus: (id: string, status: Complaint['status'], note: string) => void;
  onAddResolutionProof: (id: string, proof: EvidenceFile[], actor: 'department') => void;
  onEscalate: (id: string) => void;
}

type AdminTab = 'overview' | 'complaints' | 'escalated' | 'analytics';
type SortKey = 'priority' | 'date' | 'status';

export function AdminPanel({ complaints, stats, onLogout, onViewComplaint, onUpdateStatus, onEscalate }: Props) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDept, setFilterDept] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('priority');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredComplaints = complaints
    .filter((c) => {
      if (filterStatus !== 'all' && c.status !== filterStatus) return false;
      if (filterDept !== 'all' && c.department.id !== filterDept) return false;
      if (searchQuery && !c.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !c.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortKey === 'priority') return b.priorityScore - a.priorityScore;
      if (sortKey === 'date') return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      return a.status.localeCompare(b.status);
    });

  const departments = [...new Set(complaints.map((c) => JSON.stringify({ id: c.department.id, name: c.department.shortName })))].map((s) => JSON.parse(s) as { id: string; name: string });

  const escalatedComplaints = complaints.filter((c) => c.status === 'escalated' || c.escalations.length > 0);
  const overdueComplaints = complaints.filter((c) => new Date(c.slaDeadline) < new Date() && c.status !== 'resolved' && c.status !== 'closed');

  const deptPerformance = stats.byDepartment.map((d) => ({
    name: d.name,
    rate: Math.round((d.resolved / d.count) * 100),
    escalated: d.escalated,
  }));

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Admin Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <span>👑</span> Admin & Department Control Panel
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">Complaint management, escalation oversight, and analytics</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-red-900/50 border border-red-500/40 rounded-xl px-3 py-2 text-red-400 text-xs font-bold">
              🚨 {overdueComplaints.length} OVERDUE
            </div>
            <button
              onClick={onLogout}
              className="px-3 py-2 bg-slate-700 text-slate-300 rounded-xl text-sm hover:bg-slate-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto pb-1">
          {(['overview', 'complaints', 'escalated', 'analytics'] as AdminTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg whitespace-nowrap transition-colors ${
                activeTab === tab ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {tab === 'overview' && '📊 Overview'}
              {tab === 'complaints' && `📋 All Complaints (${filteredComplaints.length})`}
              {tab === 'escalated' && `🔺 Escalated (${escalatedComplaints.length})`}
              {tab === 'analytics' && '📈 Analytics'}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total', value: complaints.length, icon: '📋', color: 'bg-blue-600' },
                { label: 'Pending', value: complaints.filter(c => c.status === 'pending').length, icon: '⏳', color: 'bg-gray-600' },
                { label: 'In Progress', value: complaints.filter(c => c.status === 'in-progress').length, icon: '🔄', color: 'bg-blue-500' },
                { label: 'Escalated', value: escalatedComplaints.length, icon: '🔺', color: 'bg-red-600' },
                { label: 'Resolved', value: complaints.filter(c => c.status === 'resolved').length, icon: '✅', color: 'bg-green-600' },
                { label: 'Overdue', value: overdueComplaints.length, icon: '⏰', color: 'bg-orange-600' },
                { label: 'Avg Priority', value: Math.round(complaints.reduce((s, c) => s + c.priorityScore, 0) / (complaints.length || 1)), icon: '📊', color: 'bg-purple-600' },
                { label: 'With Evidence', value: complaints.filter(c => c.evidence.length > 0).length, icon: '📸', color: 'bg-teal-600' },
              ].map((kpi) => (
                <div key={kpi.label} className={`${kpi.color} rounded-2xl p-4 text-white shadow-lg`}>
                  <div className="text-xl mb-1">{kpi.icon}</div>
                  <div className="text-2xl font-black">{kpi.value}</div>
                  <div className="text-xs opacity-80">{kpi.label}</div>
                </div>
              ))}
            </div>

            {/* Priority Queue */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5">
              <h3 className="text-white font-bold mb-4">🎯 High Priority Queue (Top 5)</h3>
              <div className="space-y-3">
                {[...complaints]
                  .filter((c) => c.status !== 'resolved' && c.status !== 'closed')
                  .sort((a, b) => b.priorityScore - a.priorityScore)
                  .slice(0, 5)
                  .map((c) => (
                    <div
                      key={c.id}
                      onClick={() => onViewComplaint(c.id)}
                      className="flex items-center gap-4 p-3 bg-slate-700/50 rounded-xl hover:bg-slate-700 cursor-pointer transition-colors border border-slate-600"
                    >
                      <div className="text-2xl">{CATEGORY_META[c.category]?.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{c.title}</p>
                        <p className="text-slate-400 text-xs">{c.department.shortName} · {c.id}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <PriorityMeter score={c.priorityScore} showLabel={false} size="sm" />
                        <div className="flex items-center gap-2 mt-1">
                          <StatusBadge status={c.status} />
                          <SlaTimer deadline={c.slaDeadline} status={c.status} />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Overdue Alerts */}
            {overdueComplaints.length > 0 && (
              <div className="bg-red-950/50 border border-red-500/40 rounded-2xl p-5">
                <h3 className="text-red-400 font-bold mb-4">⚠️ SLA Breached — Immediate Action Required</h3>
                <div className="space-y-2">
                  {overdueComplaints.slice(0, 3).map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3 bg-red-900/30 rounded-xl border border-red-500/20">
                      <div>
                        <p className="text-white font-semibold text-sm">{c.title}</p>
                        <p className="text-red-400 text-xs">{c.department.shortName} · SLA: {c.department.slaHours}h</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onViewComplaint(c.id)}
                          className="text-xs px-3 py-1.5 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
                        >
                          View
                        </button>
                        <button
                          onClick={() => onEscalate(c.id)}
                          className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          Escalate
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* All Complaints Tab */}
        {activeTab === 'complaints' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4">
              <div className="flex flex-wrap gap-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search complaints..."
                  className="flex-1 min-w-[200px] bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
                />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-slate-700 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="escalated">Escalated</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <select
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="bg-slate-700 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Departments</option>
                  {departments.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as SortKey)}
                  className="bg-slate-700 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="priority">Sort: Priority</option>
                  <option value="date">Sort: Latest</option>
                  <option value="status">Sort: Status</option>
                </select>
              </div>
            </div>

            {/* Complaint List */}
            <div className="space-y-3">
              {filteredComplaints.map((c) => (
                <div
                  key={c.id}
                  className="bg-slate-800 rounded-2xl border border-slate-700 p-4 hover:border-blue-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="text-2xl shrink-0 mt-0.5">{CATEGORY_META[c.category]?.icon}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-mono text-slate-400 bg-slate-700 px-2 py-0.5 rounded">{c.id}</span>
                          <StatusBadge status={c.status} />
                          <UrgencyBadge urgency={c.urgency} />
                          {c.escalations.length > 0 && (
                            <span className="text-xs bg-red-900/50 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">
                              🔺 Escalated ×{c.escalations.length}
                            </span>
                          )}
                        </div>
                        <p className="text-white font-semibold">{c.title}</p>
                        <p className="text-slate-400 text-xs mt-1">
                          📍 {c.address.split(',')[0]} · 🏛️ {c.department.shortName} · 
                          📸 {c.evidence.length} evidence · 👥 {c.communityValidations.length} validations
                        </p>
                        <div className="mt-2 max-w-xs">
                          <PriorityMeter score={c.priorityScore} size="sm" showLabel={false} />
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col gap-2 items-end">
                      <SlaTimer deadline={c.slaDeadline} status={c.status} />
                      <div className="flex gap-2">
                        <button
                          onClick={() => onViewComplaint(c.id)}
                          className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          View Details
                        </button>
                        {c.status !== 'resolved' && c.status !== 'closed' && new Date(c.slaDeadline) < new Date() && (
                          <button
                            onClick={() => onEscalate(c.id)}
                            className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Escalate
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {filteredComplaints.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <div className="text-4xl mb-3">🔍</div>
                  <p>No complaints match your filters</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Escalated Tab */}
        {activeTab === 'escalated' && (
          <div className="space-y-4">
            <div className="bg-red-950/30 border border-red-500/30 rounded-2xl p-4">
              <p className="text-red-400 text-sm font-semibold">
                ⚠️ {escalatedComplaints.length} complaint(s) require immediate attention. SLA has been breached and formal notices have been auto-generated.
              </p>
            </div>
            {escalatedComplaints.map((c) => (
              <div key={c.id} className="bg-slate-800 rounded-2xl border border-red-500/30 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-mono text-slate-400 bg-slate-700 px-2 py-0.5 rounded">{c.id}</span>
                      <StatusBadge status={c.status} />
                      <span className="text-xs bg-red-900/50 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-bold">
                        🔺 {c.escalations.length} Escalation(s)
                      </span>
                    </div>
                    <h3 className="text-white font-bold">{c.title}</h3>
                    <p className="text-slate-400 text-xs mt-1">📍 {c.address}</p>
                  </div>
                  <button
                    onClick={() => onViewComplaint(c.id)}
                    className="text-xs px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shrink-0"
                  >
                    Full Details
                  </button>
                </div>
                {c.escalations.length > 0 && (
                  <div className="space-y-2">
                    {c.escalations.map((esc) => (
                      <div key={esc.id} className="bg-slate-700/50 rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">Level {esc.level}</span>
                          <span className="text-slate-300 text-sm ml-2">→ {esc.escalatedTo}</span>
                        </div>
                        <span className="text-slate-400 text-xs">{new Date(esc.escalatedAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => onUpdateStatus(c.id, 'in-progress', 'Department has acknowledged escalation and assigned a senior officer.')}
                    className="text-xs px-3 py-1.5 bg-green-700 text-white rounded-lg hover:bg-green-600"
                  >
                    ✅ Acknowledge
                  </button>
                  <button
                    onClick={() => onEscalate(c.id)}
                    className="text-xs px-3 py-1.5 bg-red-700 text-white rounded-lg hover:bg-red-600"
                  >
                    🔺 Escalate Further
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5">
                <h3 className="text-white font-bold mb-4">🏛️ Department Resolution Rates</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={deptPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 9 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: 12, color: '#fff' }} />
                    <Bar dataKey="rate" name="Resolution %" radius={[4, 4, 0, 0]}>
                      {deptPerformance.map((d, i) => (
                        <Cell key={i} fill={d.rate >= 80 ? '#10b981' : d.rate >= 60 ? '#f59e0b' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5">
                <h3 className="text-white font-bold mb-4">⏱ SLA Performance Summary</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Complaints within SLA', value: complaints.filter(c => new Date(c.slaDeadline) >= new Date() || c.status === 'resolved').length, color: 'text-green-400' },
                    { label: 'SLA Breached', value: overdueComplaints.length, color: 'text-red-400' },
                    { label: 'Escalated after breach', value: escalatedComplaints.filter(c => c.escalations.length > 0).length, color: 'text-orange-400' },
                    { label: 'Resolved (proof verified)', value: complaints.filter(c => c.status === 'resolved').length, color: 'text-blue-400' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl">
                      <span className="text-slate-300 text-sm">{item.label}</span>
                      <span className={`text-xl font-black ${item.color}`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Evidence Verification Stats */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5">
              <h3 className="text-white font-bold mb-4">🤖 AI Evidence Verification Summary</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total Evidence Files', value: complaints.reduce((s, c) => s + c.evidence.length, 0), icon: '📸', color: 'bg-blue-800' },
                  { label: 'Authenticated', value: complaints.reduce((s, c) => s + c.evidence.filter(e => e.verificationStatus === 'authentic').length, 0), icon: '✅', color: 'bg-green-800' },
                  { label: 'Suspicious', value: complaints.reduce((s, c) => s + c.evidence.filter(e => e.verificationStatus === 'suspicious').length, 0), icon: '⚠️', color: 'bg-yellow-800' },
                  { label: 'Rejected', value: complaints.reduce((s, c) => s + c.evidence.filter(e => e.verificationStatus === 'rejected').length, 0), icon: '❌', color: 'bg-red-800' },
                ].map((item) => (
                  <div key={item.label} className={`${item.color} rounded-xl p-4 text-white`}>
                    <div className="text-xl mb-1">{item.icon}</div>
                    <div className="text-2xl font-black">{item.value}</div>
                    <div className="text-xs opacity-80">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
