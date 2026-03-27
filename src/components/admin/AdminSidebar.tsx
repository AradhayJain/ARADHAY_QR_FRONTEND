import { Link, useLocation } from "react-router-dom";
import { ClipboardList, Users, BarChart3, LogOut, Menu, X, AlertTriangle, Settings } from "lucide-react";
import { useState } from "react";
import { usePendingRequestCount } from "@/hooks/usePendingRequestCount";
import { cn } from "@/lib/utils";

const navItems = [
  {
    title: "Pending Requests",
    href: "/admin/dashboard",
    icon: ClipboardList,
  },
  {
    title: "Approved Users",
    href: "/admin/dashboard/approved",
    icon: Users,
  },
  {
    title: "Attendance Logs",
    href: "/admin/dashboard/attendance",
    icon: BarChart3,
  },
  {
    title: "Flagged Activities",
    href: "/admin/dashboard/flagged",
    icon: AlertTriangle,
  },
  {
    title: "System Settings",
    href: "/admin/dashboard/settings",
    icon: Settings,
  },
];

interface AdminSidebarProps {
  onLogout: () => void;
}

const AdminSidebar = ({ onLogout }: AdminSidebarProps) => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pendingCount = usePendingRequestCount();

  return (
    <>
      {/* Mobile Top Navbar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-b border-border z-40 flex items-center justify-between px-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xs">FD</span>
          </div>
          <span className="font-bold text-foreground">FocusDesk Admin</span>
        </div>
        <button
          className="p-2 text-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-white dark:bg-slate-900 text-foreground border-r border-border z-50 transition-transform duration-300 shadow-xl",
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold">FD</span>
              </div>
              <div>
                <p className="font-semibold text-foreground">FocusDesk</p>
                <p className="text-xs text-muted-foreground">Admin Panel</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              const showDot = item.title === "Pending Requests" && pendingCount > 0;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="relative flex items-center">
                    {item.title}
                    {showDot && (
                      <span className="ml-2 w-2.5 h-2.5 bg-red-500 rounded-full inline-block animate-pulse border-2 border-white" />
                    )}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <button
              onClick={onLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
