import { useState } from 'react';
import type { Complaint, EvidenceFile } from '../types';
import { StatusBadge, UrgencyBadge } from './ui/StatusBadge';
import { PriorityMeter } from './ui/PriorityMeter';
import { SlaTimer } from './ui/SlaTimer';
import { EvidenceUploader } from './EvidenceUploader';
import { getVerificationBadgeColor, getVerificationIcon, getScoreColor } from '../utils/evidenceVerifier';

interface Props {
  complaint: Complaint;
  isAdmin?: boolean;
  onBack: () => void;
  onUpdateStatus: (id: string, status: Complaint['status'], note: string) => void;
  onAddResolutionProof: (id: string, proof: EvidenceFile[], actor: 'citizen' | 'department' | 'admin') => void;
  onCommunityValidate: (id: string, comment: string) => void;
  onEscalate: (id: string) => void;
}

export function ComplaintDetail({
  complaint,
  isAdmin,
  onBack,
  onUpdateStatus,
  onAddResolutionProof,
  onCommunityValidate,
  onEscalate,
}: Props) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'evidence' | 'escalation' | 'documents'>('timeline');
  const [proofFiles, setProofFiles] = useState<EvidenceFile[]>([]);
  const [validationComment, setValidationComment] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [newStatus, setNewStatus] = useState<Complaint['status']>(complaint.status);
  const [showDocModal, setShowDocModal] = useState<{ type: 'rti' | 'letter' | 'media'; content: string } | null>(null);

  const isOverdue = new Date(complaint.slaDeadline) < new Date();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <button onClick={onBack} className="text-gray-500 hover:text-gray-700 mt-1 shrink-0">← Back</button>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{complaint.id}</span>
                  <StatusBadge status={complaint.status} />
                  <UrgencyBadge urgency={complaint.urgency} />
                </div>
                <h1 className="text-lg font-bold text-gray-900 mt-1">{complaint.title}</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-gray-200 p-3 text-center shadow-sm">
            <p className="text-xl font-black text-blue-700">{complaint.priorityScore}</p>
            <p className="text-xs text-gray-500">Priority Score</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3 text-center shadow-sm">
            <p className="text-xl font-black text-purple-700">{complaint.communityValidations.length}</p>
            <p className="text-xs text-gray-500">Validations</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3 text-center shadow-sm">
            <p className="text-xl font-black text-orange-700">{complaint.escalations.length}</p>
            <p className="text-xs text-gray-500">Escalations</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3 text-center shadow-sm">
            <p className="text-xl font-black text-green-700">{complaint.evidence.length}</p>
            <p className="text-xs text-gray-500">Evidence Files</p>
          </div>
        </div>

        {/* Main Info Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</p>
                <p className="text-sm text-gray-800 mt-1 leading-relaxed">{complaint.description}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</p>
                <p className="text-sm text-gray-800 mt-1">📍 {complaint.address}</p>
                <p className="text-xs text-gray-500">GPS: {complaint.location.lat.toFixed(5)}, {complaint.location.lng.toFixed(5)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filed By</p>
                <p className="text-sm text-gray-800 mt-1">
                  {complaint.isAnonymous ? '🕵️ Anonymous' : `👤 ${complaint.citizenName}`}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Responsible Department</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl">{complaint.department.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{complaint.department.name}</p>
                    <p className="text-xs text-gray-500">{complaint.department.contactEmail}</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">SLA Status</p>
                <SlaTimer deadline={complaint.slaDeadline} status={complaint.status} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Priority</p>
                <PriorityMeter score={complaint.priorityScore} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Submitted</p>
                <p className="text-sm text-gray-700">{new Date(complaint.submittedAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Overdue Warning */}
        {isOverdue && complaint.status !== 'resolved' && complaint.status !== 'closed' && (
          <div className="bg-red-50 border border-red-300 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-2xl">🚨</span>
            <div>
              <p className="font-bold text-red-800">SLA BREACHED — Immediate Escalation Required</p>
              <p className="text-sm text-red-700 mt-1">
                This complaint exceeded its {complaint.department.slaHours}-hour SLA. No action has been taken by {complaint.department.name}.
              </p>
              <button
                onClick={() => onEscalate(complaint.id)}
                className="mt-2 px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
              >
                🔺 Trigger Escalation Now
              </button>
            </div>
          </div>
        )}

        {/* Resolution Status */}
        {complaint.status === 'resolved' && (
          <div className="bg-green-50 border border-green-300 rounded-2xl p-4">
            <p className="font-bold text-green-800">✅ RESOLVED — Proof-Verified Closure</p>
            <div className="flex gap-4 mt-2 text-sm text-green-700">
              <span>{complaint.resolutionConfirmedByCitizen ? '✅ Citizen Confirmed' : '⏳ Awaiting Citizen'}</span>
              <span>{complaint.resolutionConfirmedByAdmin ? '✅ Admin Confirmed' : '⏳ Awaiting Admin'}</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {(['timeline', 'evidence', 'escalation', 'documents'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-colors ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                {tab === 'timeline' && `⏱ Timeline (${complaint.timeline.length})`}
                {tab === 'evidence' && `📸 Evidence (${complaint.evidence.length})`}
                {tab === 'escalation' && `🔺 Escalations (${complaint.escalations.length})`}
                {tab === 'documents' && '📄 Documents'}
              </button>
            ))}
          </div>

          <div className="p-5">
            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
              <div className="space-y-4">
                <div className="relative">
                  {complaint.timeline.map((entry, idx) => (
                    <div key={entry.id} className="flex gap-4 pb-6 relative">
                      {/* Line */}
                      {idx < complaint.timeline.length - 1 && (
                        <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-200" />
                      )}
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm z-10 border-2 ${
                        entry.actorType === 'system' ? 'bg-purple-100 border-purple-300 text-purple-700' :
                        entry.actorType === 'citizen' ? 'bg-blue-100 border-blue-300 text-blue-700' :
                        entry.actorType === 'department' ? 'bg-green-100 border-green-300 text-green-700' :
                        'bg-gray-100 border-gray-300 text-gray-700'
                      }`}>
                        {entry.actorType === 'system' ? '🤖' :
                         entry.actorType === 'citizen' ? '👤' :
                         entry.actorType === 'department' ? '🏛️' : '👑'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <span className="text-sm font-bold text-gray-800">{entry.action}</span>
                            <span className="text-xs text-gray-500 ml-2">by {entry.actor}</span>
                          </div>
                          <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                            {new Date(entry.timestamp).toLocaleDateString()} {new Date(entry.timestamp).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">{entry.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Community Validation */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-800 mb-3">🤝 Validate This Issue (Nearby Resident)</h4>
                  <textarea
                    value={validationComment}
                    onChange={(e) => setValidationComment(e.target.value)}
                    placeholder="Confirm you've witnessed this issue and add a comment..."
                    rows={2}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <button
                    onClick={() => {
                      if (validationComment) {
                        onCommunityValidate(complaint.id, validationComment);
                        setValidationComment('');
                      }
                    }}
                    disabled={!validationComment}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-blue-700 transition-colors"
                  >
                    ✅ Confirm Issue
                  </button>
                  {complaint.communityValidations.length > 0 && (
                    <p className="text-xs text-green-600 mt-2">
                      👥 {complaint.communityValidations.length} community member(s) have validated this issue
                    </p>
                  )}
                </div>

                {/* Admin Controls */}
                {isAdmin && (
                  <div className="border-t pt-4 bg-yellow-50 rounded-xl p-4">
                    <h4 className="font-bold text-gray-800 mb-3">👑 Admin Controls</h4>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1 block">Update Status</label>
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value as Complaint['status'])}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="in-progress">In Progress</option>
                          <option value="escalated">Escalated</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                    </div>
                    <textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Add admin note or action taken..."
                      rows={2}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-2"
                    />
                    <button
                      onClick={() => {
                        if (adminNote) {
                          onUpdateStatus(complaint.id, newStatus, adminNote);
                          setAdminNote('');
                        }
                      }}
                      disabled={!adminNote}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-yellow-700"
                    >
                      💾 Update Status
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Evidence Tab */}
            {activeTab === 'evidence' && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-gray-800 mb-3">Original Evidence ({complaint.evidence.length} files)</h4>
                  {complaint.evidence.length === 0 ? (
                    <p className="text-sm text-gray-500">No evidence submitted.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {complaint.evidence.map((ev) => (
                        <EvidenceCard key={ev.id} evidence={ev} />
                      ))}
                    </div>
                  )}
                </div>

                {complaint.resolutionProof && complaint.resolutionProof.length > 0 && (
                  <div>
                    <h4 className="font-bold text-green-700 mb-3">✅ Resolution Proof ({complaint.resolutionProof.length} files)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {complaint.resolutionProof.map((ev) => (
                        <EvidenceCard key={ev.id} evidence={ev} isResolution />
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Resolution Proof */}
                {complaint.status !== 'resolved' && complaint.status !== 'closed' && (
                  <div className="border-t pt-4">
                    <h4 className="font-bold text-gray-800 mb-2">
                      {isAdmin ? '🏛️ Upload Resolution Proof (Department)' : '📸 Upload Resolution Proof (Citizen)'}
                    </h4>
                    <p className="text-xs text-gray-500 mb-3">
                      Upload photos/videos showing the issue has been resolved. Complaint will be marked resolved only after proof verification.
                    </p>
                    <EvidenceUploader
                      onEvidenceChange={setProofFiles}
                      reportedLocation={complaint.location}
                      category={complaint.category}
                      label="Upload resolution proof"
                      maxFiles={5}
                    />
                    {proofFiles.length > 0 && (
                      <button
                        onClick={() => onAddResolutionProof(complaint.id, proofFiles, isAdmin ? 'admin' : 'citizen')}
                        className="mt-3 w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
                      >
                        ✅ Submit Resolution Proof
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Escalation Tab */}
            {activeTab === 'escalation' && (
              <div className="space-y-4">
                {complaint.escalations.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">✅</div>
                    <p className="text-gray-600 font-medium">No escalations yet</p>
                    <p className="text-sm text-gray-500 mt-1">Escalations trigger automatically if SLA is breached</p>
                  </div>
                ) : (
                  complaint.escalations.map((esc) => (
                    <div key={esc.id} className="border border-red-200 bg-red-50 rounded-2xl p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">Level {esc.level}</span>
                          <h4 className="font-bold text-gray-800 mt-1">Escalated to {esc.escalatedTo}</h4>
                          <p className="text-xs text-gray-500">{new Date(esc.escalatedAt).toLocaleString()}</p>
                        </div>
                        {esc.autoGenerated && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">🤖 Auto</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-3">{esc.reason}</p>
                      <div className="flex flex-wrap gap-2">
                        {esc.formalLetter && (
                          <button
                            onClick={() => setShowDocModal({ type: 'letter', content: esc.formalLetter! })}
                            className="text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200 transition-colors"
                          >
                            📄 View Formal Letter
                          </button>
                        )}
                        {esc.rtiDraft && (
                          <button
                            onClick={() => setShowDocModal({ type: 'rti', content: esc.rtiDraft! })}
                            className="text-xs px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 transition-colors"
                          >
                            📜 RTI Draft
                          </button>
                        )}
                        {esc.mediaSummary && (
                          <button
                            onClick={() => setShowDocModal({ type: 'media', content: esc.mediaSummary! })}
                            className="text-xs px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg font-semibold hover:bg-yellow-200 transition-colors"
                          >
                            📰 Media Summary
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {isOverdue && complaint.escalations.length < 4 && complaint.status !== 'resolved' && (
                  <button
                    onClick={() => onEscalate(complaint.id)}
                    className="w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
                  >
                    🔺 Trigger Next Escalation Level
                  </button>
                )}
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">Auto-generated legal and formal documents for this complaint.</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { icon: '📄', title: 'Formal Escalation Letter', desc: 'Official notice to department head', color: 'red', available: complaint.escalations.length > 0 },
                    { icon: '📜', title: 'RTI Application Draft', desc: 'Right to Information request template', color: 'blue', available: complaint.escalations.length > 0 },
                    { icon: '📰', title: 'Media Incident Summary', desc: 'Factual summary for public record', color: 'yellow', available: complaint.escalations.length > 1 },
                  ].map((doc) => (
                    <div key={doc.title} className={`rounded-xl border p-4 ${doc.available ? `bg-${doc.color}-50 border-${doc.color}-200` : 'bg-gray-50 border-gray-200'}`}>
                      <div className="text-2xl mb-2">{doc.icon}</div>
                      <h5 className="text-sm font-bold text-gray-800">{doc.title}</h5>
                      <p className="text-xs text-gray-500 mt-1 mb-3">{doc.desc}</p>
                      {doc.available ? (
                        <button
                          onClick={() => {
                            const esc = complaint.escalations[0];
                            if (!esc) return;
                            const content = doc.title.includes('Letter') ? esc.formalLetter :
                              doc.title.includes('RTI') ? esc.rtiDraft : esc.mediaSummary;
                            if (content) setShowDocModal({ type: doc.title.includes('Letter') ? 'letter' : doc.title.includes('RTI') ? 'rti' : 'media', content });
                          }}
                          className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                        >
                          View & Copy
                        </button>
                      ) : (
                        <p className="text-xs text-gray-400">Available after escalation</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document Modal */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowDocModal(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-gray-900">
                {showDocModal.type === 'letter' && '📄 Formal Escalation Letter'}
                {showDocModal.type === 'rti' && '📜 RTI Application Draft'}
                {showDocModal.type === 'media' && '📰 Media Incident Summary'}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard.writeText(showDocModal.content)}
                  className="text-xs px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200"
                >
                  📋 Copy
                </button>
                <button onClick={() => setShowDocModal(null)} className="text-gray-500 hover:text-gray-700 text-xl ml-2">✕</button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(85vh-80px)]">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 rounded-xl p-4 leading-relaxed">{showDocModal.content}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EvidenceCard({ evidence, isResolution }: { evidence: EvidenceFile; isResolution?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const statusColors = getVerificationBadgeColor(evidence.verificationStatus);
  const statusIcon = getVerificationIcon(evidence.verificationStatus);

  return (
    <div className={`rounded-xl border overflow-hidden ${isResolution ? 'border-green-200' : 'border-gray-200'}`}>
      <div className="bg-gray-800" style={{ height: '160px' }}>
        {evidence.dataUrl ? (
          evidence.type === 'image' ? (
            <img src={evidence.dataUrl} alt={evidence.name} className="w-full h-full object-cover" />
          ) : (
            <video src={evidence.dataUrl} className="w-full h-full object-cover" controls muted />
          )
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-1">{evidence.type === 'video' ? '🎥' : '🖼️'}</div>
              <div className="text-xs">{evidence.name}</div>
            </div>
          </div>
        )}
      </div>
      <div className="p-3 bg-white">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-700 truncate">{evidence.name}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full border font-semibold ${statusColors}`}>
            {statusIcon} {evidence.verificationScore}%
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {evidence.gps && <span>📍 GPS ✓</span>}
          {evidence.capturedAt && <span>🕐 {new Date(evidence.capturedAt).toLocaleDateString()}</span>}
          <span className={getScoreColor(evidence.verificationScore)}>{evidence.verificationStatus}</span>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="text-xs text-blue-600 mt-1 hover:underline">
          {expanded ? 'Hide checks' : 'View AI checks'}
        </button>
        {expanded && (
          <div className="mt-2 space-y-1">
            {evidence.verificationDetails.map((c) => (
              <div key={c.check} className="flex items-center gap-1.5 text-xs">
                <span>{c.passed ? '✅' : '❌'}</span>
                <span className="text-gray-700">{c.check}</span>
                <span className={`ml-auto font-bold ${getScoreColor(c.score)}`}>{c.score}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
