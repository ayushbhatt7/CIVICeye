import type { Complaint } from '../types';
import { StatusBadge, UrgencyBadge } from './ui/StatusBadge';
import { PriorityMeter } from './ui/PriorityMeter';
import { SlaTimer } from './ui/SlaTimer';
import { CATEGORY_META } from '../data/mockData';

interface Props {
  complaints: Complaint[];
  onViewComplaint: (id: string) => void;
  onSubmitNew: () => void;
  onBack: () => void;
}

export function CitizenDashboard({ complaints, onViewComplaint, onSubmitNew, onBack }: Props) {
  const myComplaints = complaints.slice(0, 8);

  const stats = {
    total: myComplaints.length,
    pending: myComplaints.filter((c) => c.status === 'pending').length,
    inProgress: myComplaints.filter((c) => c.status === 'in-progress').length,
    escalated: myComplaints.filter((c) => c.status === 'escalated').length,
    resolved: myComplaints.filter((c) => c.status === 'resolved').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-gray-500 hover:text-gray-700 transition-colors">← Back</button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">My Complaints</h1>
              <p className="text-xs text-gray-500">Track and manage your filed complaints</p>
            </div>
          </div>
          <button
            onClick={onSubmitNew}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            + New Complaint
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-5 gap-2">
          {[
            { label: 'Total', value: stats.total, color: 'bg-blue-600 text-white' },
            { label: 'Pending', value: stats.pending, color: 'bg-gray-200 text-gray-700' },
            { label: 'Active', value: stats.inProgress, color: 'bg-blue-200 text-blue-800' },
            { label: 'Escalated', value: stats.escalated, color: 'bg-red-200 text-red-800' },
            { label: 'Resolved', value: stats.resolved, color: 'bg-green-200 text-green-800' },
          ].map((s) => (
            <div key={s.label} className={`${s.color} rounded-xl p-3 text-center shadow-sm`}>
              <p className="text-xl font-black">{s.value}</p>
              <p className="text-xs font-semibold opacity-80">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Complaint List */}
        <div className="space-y-3">
          {myComplaints.map((c) => {
            const isOverdue = new Date(c.slaDeadline) < new Date() && c.status !== 'resolved' && c.status !== 'closed';
            return (
              <div
                key={c.id}
                onClick={() => onViewComplaint(c.id)}
                className={`bg-white rounded-2xl border shadow-sm p-4 cursor-pointer hover:shadow-md transition-all hover:border-blue-300 ${
                  isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="text-2xl shrink-0 mt-0.5">{CATEGORY_META[c.category]?.icon}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{c.id}</span>
                        <StatusBadge status={c.status} />
                        {c.escalations.length > 0 && (
                          <span className="text-xs bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-semibold">
                            🔺 Escalated
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-gray-900">{c.title}</p>
                      <p className="text-sm text-gray-500 mt-0.5 truncate">📍 {c.address}</p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <UrgencyBadge urgency={c.urgency} />
                        <SlaTimer deadline={c.slaDeadline} status={c.status} />
                        {c.communityValidations.length > 0 && (
                          <span className="text-xs text-purple-600">👥 {c.communityValidations.length} validations</span>
                        )}
                      </div>
                      <div className="mt-2 max-w-[200px]">
                        <PriorityMeter score={c.priorityScore} showLabel={false} size="sm" />
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 text-right shrink-0">
                    <p>{new Date(c.submittedAt).toLocaleDateString()}</p>
                    <p className="text-blue-600 mt-1 font-medium">🏛️ {c.department.shortName}</p>
                    <p className="mt-1">📸 {c.evidence.length} files</p>
                  </div>
                </div>

                {/* Resolution progress bar */}
                {c.status === 'resolved' && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-3 text-sm text-green-700">
                      <span>✅ Resolved</span>
                      {c.resolutionConfirmedByCitizen && <span className="text-xs">· Citizen confirmed</span>}
                      {c.resolutionConfirmedByAdmin && <span className="text-xs">· Admin confirmed</span>}
                    </div>
                  </div>
                )}

                {isOverdue && (
                  <div className="mt-3 pt-3 border-t border-red-200">
                    <p className="text-xs text-red-600 font-semibold">⚠️ SLA exceeded — auto-escalation may be triggered</p>
                  </div>
                )}

                {c.timeline.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-50">
                    <p className="text-xs text-gray-500">
                      Last update: {c.timeline[c.timeline.length - 1].action} · {new Date(c.timeline[c.timeline.length - 1].timestamp).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {myComplaints.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
              <div className="text-5xl mb-3">📋</div>
              <p className="text-gray-600 font-semibold">No complaints filed yet</p>
              <p className="text-gray-400 text-sm mt-1">Submit your first complaint to get started</p>
              <button
                onClick={onSubmitNew}
                className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                File a Complaint
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
