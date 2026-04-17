import { useState } from 'react';
import { useAppStore } from './store/appStore';
import { LandingPage } from './components/LandingPage';
import { ComplaintSubmitForm } from './components/ComplaintSubmitForm';
import { ComplaintDetail } from './components/ComplaintDetail';
import { CitizenDashboard } from './components/CitizenDashboard';
import { PublicDashboard } from './components/PublicDashboard';
import { AdminPanel } from './components/AdminPanel';

import type { EvidenceFile, Complaint } from './types';

interface SuccessData {
  complaintId: string;
  department: string;
  slaHours: number;
}

export default function App() {
  const {
    state,
    navigate,
    adminLogin,
    adminLogout,
    submitComplaint,
    updateComplaintStatus,
    addResolutionProof,
    addCommunityValidation,
    triggerEscalation,
    selectedComplaint,
  } = useAppStore();

  const [successData, setSuccessData] = useState<SuccessData | null>(null);

  const handleSubmitComplaint = (data: Partial<Complaint>) => {
    const id = submitComplaint(data);
    const dept = data.department || { name: 'General Administration', slaHours: 120 };
    setSuccessData({
      complaintId: id,
      department: dept.name,
      slaHours: dept.slaHours,
    });
    navigate('complaint-detail', id);
  };

  const handleAdminLogin = (pw: string): boolean => {
    const success = adminLogin(pw);
    if (success) navigate('admin-panel');
    return success;
  };

  const handleViewComplaint = (id: string) => {
    navigate('complaint-detail', id);
  };

  const handleAddResolutionProof = (
    id: string,
    proof: EvidenceFile[],
    actor: 'citizen' | 'department' | 'admin'
  ) => {
    addResolutionProof(id, proof, actor);
  };

  // Show success page briefly after submit
  if (successData && state.view === 'complaint-detail' && state.selectedComplaintId) {
    const isNewComplaint = state.complaints.find(c => c.id === state.selectedComplaintId)?.timeline.length === 2;
    if (isNewComplaint) {
      // Check if we should show success first
    }
  }

  return (
    <div className="font-sans antialiased">
      {state.view === 'landing' && (
        <LandingPage
          onSubmitComplaint={() => navigate('submit')}
          onViewDashboard={() => navigate('citizen-dashboard')}
          onViewPublic={() => navigate('public-dashboard')}
          onAdminLogin={handleAdminLogin}
          totalComplaints={state.dashboardStats.totalComplaints}
          resolvedComplaints={state.dashboardStats.resolvedComplaints}
        />
      )}

      {state.view === 'submit' && (
        <ComplaintSubmitForm
          onSubmit={handleSubmitComplaint}
          onCancel={() => navigate('landing')}
        />
      )}

      {state.view === 'citizen-dashboard' && (
        <CitizenDashboard
          complaints={state.complaints}
          onViewComplaint={handleViewComplaint}
          onSubmitNew={() => navigate('submit')}
          onBack={() => navigate('landing')}
        />
      )}

      {state.view === 'complaint-detail' && selectedComplaint && (
        <ComplaintDetail
          complaint={selectedComplaint}
          isAdmin={state.isAdminLoggedIn}
          onBack={() => navigate(state.isAdminLoggedIn ? 'admin-panel' : 'citizen-dashboard')}
          onUpdateStatus={updateComplaintStatus}
          onAddResolutionProof={handleAddResolutionProof}
          onCommunityValidate={addCommunityValidation}
          onEscalate={triggerEscalation}
        />
      )}

      {state.view === 'public-dashboard' && (
        <PublicDashboard
          stats={state.dashboardStats}
          complaints={state.complaints}
          onViewComplaint={handleViewComplaint}
          onBack={() => navigate('landing')}
        />
      )}

      {state.view === 'admin-panel' && state.isAdminLoggedIn && (
        <AdminPanel
          complaints={state.complaints}
          stats={state.dashboardStats}
          onLogout={() => { adminLogout(); navigate('landing'); }}
          onViewComplaint={(id) => { navigate('complaint-detail', id); }}
          onUpdateStatus={updateComplaintStatus}
          onAddResolutionProof={(id, proof) => handleAddResolutionProof(id, proof, 'department')}
          onEscalate={triggerEscalation}
        />
      )}

      {state.view === 'admin-panel' && !state.isAdminLoggedIn && (
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
          <div className="text-center text-white">
            <p className="text-xl mb-4">⛔ Access Denied</p>
            <button onClick={() => navigate('landing')} className="px-6 py-3 bg-blue-600 rounded-xl">
              Go Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
