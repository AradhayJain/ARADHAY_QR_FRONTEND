import { useNavigate, Routes, Route, Navigate } from "react-router-dom";
import AdminSidebar from "@/components/admin/AdminSidebar";
import PendingRequestsTable from "@/components/admin/PendingRequestsTable";
import ApprovedUsersTable from "@/components/admin/ApprovedUsersTable";
import AttendanceTable from "@/components/admin/AttendanceTable";
import SystemSettings from "@/components/admin/SystemSettings";
import FlaggedActivities from "@/pages/FlaggedActivities";
import UserProfile from "@/pages/UserProfile";
import { toast } from "sonner";
import { useEffect } from "react";
import API from "@/api/api"; // Needed for setting the full SSE URL correctly

const AdminDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    toast.success("Logged out successfully");
    navigate("/admin/login");
  };

  useEffect(() => {
    // Determine base URL dynamically if API.defaults is set
    const baseURL = API.defaults.baseURL || import.meta.env.VITE_API_URL || "http://localhost:5000";
    console.log("Setting up SSE connection to:", baseURL);
    
    const eventSource = new EventSource(`${baseURL}/api/admin/notifications/stream`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'NEW_REQUEST') {
          toast.success(`New QR Request from ${data.user} (${data.rollNo})!`, {
            duration: 5000,
            icon: '🔔',
          });
        }
      } catch (err) {
        console.error("Failed to parse SSE message:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE connection error", err);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar onLogout={handleLogout} />
      
      <main className="lg:pl-64">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8 pt-12 lg:pt-0">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage access requests and monitor attendance
            </p>
          </div>

          {/* Content */}
          <Routes>
            <Route index element={<PendingRequestsTable />} />
            <Route path="approved" element={<ApprovedUsersTable />} />
            <Route path="attendance" element={<AttendanceTable />} />
            <Route path="flagged" element={<FlaggedActivities />} />
            <Route path="settings" element={<SystemSettings />} />
            <Route path="user-profile/:id" element={<UserProfile />} />
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
