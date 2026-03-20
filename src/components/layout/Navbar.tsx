import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, UserCircle, LogOut, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import focusDeskLogo from "@/assets/focusdesk-logo.png";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  const navigate = useNavigate();

  // ✅ Check login status
  useEffect(() => {
    const stored = localStorage.getItem("focusdesk_user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  // ✅ Logout
  const handleLogout = () => {
    localStorage.removeItem("focusdesk_user");
    localStorage.removeItem("userIdNumber");
    setUser(null);
    navigate("/login");
  };

  // ✅ Nav Links based on login
  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Features", href: "/features" },
    { name: "How it Works", href: "/how-it-works" },
    // { name: "Admin", href: "/admin/login" },
    ...(user ? [
      { name: "My QR", href: "/user/viewqr" }
    ] : []),
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">

          {/* ✅ Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img
              src={focusDeskLogo}
              alt="FocusDesk Logo"
              className="w-9 h-9 object-contain"
            />
            <span className="font-semibold text-lg text-foreground">
              FocusDesk
            </span>
          </Link>

          {/* ✅ Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) =>
              <Link
                key={link.name}
                to={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition"
                reloadDocument={link.name === "My QR"}
              >
                {link.name}
              </Link>
            )}
          </div>

          {/* ✅ Right Side Auth + New Request Icon */}
          <div className="hidden md:flex items-center gap-4">
            {!user ? (
              <Link to="/login">
                <Button size="sm">Login</Button>
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                {/* New Request green icon */}
                <Link to="/user/request" title="New Request">
                  <Plus className="w-7 h-7 text-green-600 hover:text-green-700 transition cursor-pointer" style={{ background: '#e6f9ec', borderRadius: '50%', padding: 4 }} />
                </Link>
                <UserCircle className="w-7 h-7 text-muted-foreground cursor-pointer" onClick={() => navigate("/user/profile")} />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Logout
                </Button>
              </div>
            )}
          </div>

          {/* ✅ Mobile Menu Toggle */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* ✅ Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background border-t"
          >
            <div className="px-6 py-4 space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  {link.name}
                </Link>
              ))}

              {!user ? (
                <Link to="/login">
                  <Button className="w-full mt-3">Login</Button>
                </Link>
              ) : (
                <Button
                  variant="destructive"
                  className="w-full mt-3"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
