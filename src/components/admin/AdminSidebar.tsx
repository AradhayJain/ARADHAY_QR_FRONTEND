import { Link, useLocation } from "react-router-dom";
import {
  ClipboardList,
  Users,
  BarChart3,
  LogOut,
  Menu,
  X,
  AlertTriangle,
  Settings,
} from "lucide-react";
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
      <div
        className="lg:hidden fixed top-0 left-0 right-0 h-16 z-40 flex items-center justify-between px-4 shadow-lg"
        style={{
          backgroundColor: "hsl(var(--sidebar-background))",
          borderBottom: "1px solid hsl(var(--sidebar-border))",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs"
            style={{
              backgroundColor: "hsl(var(--sidebar-primary))",
              color: "hsl(var(--sidebar-primary-foreground))",
            }}
          >
            FD
          </div>
          <span
            className="font-bold text-sm"
            style={{ color: "hsl(var(--sidebar-foreground))" }}
          >
            FocusDesk Admin
          </span>
        </div>
        <button
          className="p-2 rounded-lg transition-colors"
          style={{ color: "hsl(var(--sidebar-foreground))" }}
          onClick={() => setMobileOpen(!mobileOpen)}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor =
              "hsl(var(--sidebar-accent))")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "transparent")
          }
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 z-50 transition-transform duration-300 ease-in-out flex flex-col",
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          backgroundColor: "hsl(var(--sidebar-background))",
          borderRight: "1px solid hsl(var(--sidebar-border))",
          boxShadow: "4px 0 24px rgba(0,0,0,0.25)",
        }}
      >
        {/* Header */}
        <div
          className="p-6 flex items-center gap-3 flex-shrink-0"
          style={{ borderBottom: "1px solid hsl(var(--sidebar-border))" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
            style={{
              backgroundColor: "hsl(var(--sidebar-primary))",
              color: "hsl(var(--sidebar-primary-foreground))",
            }}
          >
            FD
          </div>
          <div>
            <p
              className="font-semibold text-sm leading-tight"
              style={{ color: "hsl(var(--sidebar-foreground))" }}
            >
              FocusDesk
            </p>
            <p
              className="text-xs mt-0.5"
              style={{
                color: "hsl(var(--sidebar-foreground) / 0.6)",
              }}
            >
              Admin Panel
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <p
            className="text-xs font-semibold uppercase tracking-widest px-3 pt-2 pb-1"
            style={{ color: "hsl(var(--sidebar-foreground) / 0.4)" }}
          >
            Navigation
          </p>
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            const showDot =
              item.title === "Pending Requests" && pendingCount > 0;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group"
                )}
                style={
                  isActive
                    ? {
                        backgroundColor: "hsl(var(--sidebar-primary))",
                        color: "hsl(var(--sidebar-primary-foreground))",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                      }
                    : {
                        color: "hsl(var(--sidebar-foreground) / 0.75)",
                        backgroundColor: "transparent",
                      }
                }
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor =
                      "hsl(var(--sidebar-accent))";
                    e.currentTarget.style.color =
                      "hsl(var(--sidebar-accent-foreground))";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color =
                      "hsl(var(--sidebar-foreground) / 0.75)";
                  }
                }}
              >
                {/* Active indicator bar */}
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full transition-opacity duration-200"
                  style={{
                    backgroundColor: "hsl(var(--sidebar-primary-foreground))",
                    opacity: isActive ? 1 : 0,
                  }}
                />
                <item.icon
                  className="w-4.5 h-4.5 flex-shrink-0"
                  style={{
                    width: "1.125rem",
                    height: "1.125rem",
                    opacity: isActive ? 1 : 0.8,
                  }}
                />
                <span className="flex-1 flex items-center gap-2 truncate">
                  {item.title}
                  {showDot && (
                    <span className="ml-auto flex-shrink-0 w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                  )}
                </span>
                {showDot && pendingCount > 0 && (
                  <span
                    className="flex-shrink-0 text-xs font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: "hsl(0 84% 60% / 0.2)",
                      color: "hsl(0 84% 70%)",
                    }}
                  >
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div
          className="p-3 flex-shrink-0"
          style={{ borderTop: "1px solid hsl(var(--sidebar-border))" }}
        >
          <button
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
            style={{ color: "hsl(var(--sidebar-foreground) / 0.65)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "hsl(0 70% 50% / 0.15)";
              e.currentTarget.style.color = "hsl(0 70% 70%)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color =
                "hsl(var(--sidebar-foreground) / 0.65)";
            }}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
