import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { QrCode, Shield, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const HeroSection = () => {
  const user = localStorage.getItem("focusdesk_user");
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-hero-gradient overflow-hidden pt-16">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
          >
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Secure Access System</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6"
          >
            Secure QR-Based Room &{" "}
            <span className="text-gradient">Library Access System</span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            Entry/Exit access powered by smart QR verification and real-time attendance tracking.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            {user ? (
              <Link to="/user/viewqr">
                <Button size="lg" className="btn-gradient glow-primary px-8 py-6 text-base">
                  <QrCode className="mr-2 h-5 w-5" />
                  My QR
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button size="lg" className="btn-gradient glow-primary px-8 py-6 text-base">
                  <QrCode className="mr-2 h-5 w-5" />
                  Generate QR Access
                </Button>
              </Link>
            )}
            {/* <Link to="/admin/login">
              <Button variant="outline" size="lg" className="px-8 py-6 text-base group">
                Admin Dashboard
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link> */}
          </motion.div>


        </div>
      </div>
    </section>
  );
};

export default HeroSection;
