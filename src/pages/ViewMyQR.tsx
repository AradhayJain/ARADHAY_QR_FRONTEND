import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { Loader2, QrCode, ScanFace, CheckCircle2, XCircle, DoorOpen } from "lucide-react";
import { toast } from "sonner";
import API from "@/api/api";
import { Button } from "@/components/ui/button";
import QRCode from "react-qr-code";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import DecorationBackground from "@/components/ui/DecorationBackground";

// Audio utility
const SUCCESS_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2430/2430-preview.mp3";

const ViewMyQR = () => {
  const navigate = useNavigate();

  const [qrString, setQrString] = useState<string | null>(null);
  const [passType, setPassType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [targetMachine, setTargetMachine] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [isFlagged, setIsFlagged] = useState(false);
  const [flagReason, setFlagReason] = useState<string | null>(null);
  const [restrictionUntil, setRestrictionUntil] = useState<string | null>(null);

  const [countdown, setCountdown] = useState(20);

  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Preload audio
    audioRef.current = new Audio(SUCCESS_SOUND_URL);
    
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const playSuccessSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.error("Audio play failed", e));
    }
  };

  const clearTimers = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

  const generateToken = async () => {
    const userStr = localStorage.getItem("focusdesk_user");
    if (!userStr) {
      toast.error("Please login first");
      navigate("/login");
      return;
    }

    const user = JSON.parse(userStr);
    const userRollNo = user.rollNo || user.idNumber;
    const preferredMachine = user.preferredMachineId || user.preferredMachine || user.machineId || "GATE_A_MAIN";
    setTargetMachine(preferredMachine);

    try {
      setLoading(true);
      clearTimers();
      setCountdown(20);

      // ✅ UNLOCK AUDIO CONTEXT: Prime the audio for the success chime
      if (audioRef.current) {
        audioRef.current.volume = 0;
        audioRef.current.play().then(() => {
          audioRef.current!.pause();
          audioRef.current!.volume = 1;
        }).catch(e => console.log("Audio primer error:", e));
      }

      const res = await API.post("/api/user/allocate-qr", {
        idNumber: userRollNo,
        machineId: preferredMachine
      });

      if (res.data.status === "RESTRICTED") {
        setRestrictionUntil(res.data.restrictionUntil);
        toast.error("Account Temporarily Restricted");
        setLoading(false);
        return;
      }

      const { 
        qrData: allocatedQrData, 
        passType: allocatedPassType, 
        currentState: initialDBState, 
        isFlagged: flagged, 
        flagReason: reason 
      } = res.data;

      console.log(`[POLL] Starting. Initial State: ${initialDBState}, QR Type: ${allocatedPassType}`);

      setQrString(`${allocatedQrData}|${Date.now()}`);
      setPassType(allocatedPassType);
      setIsFlagged(flagged);
      setFlagReason(reason);
      toast.success(`Access Pass Allocated for ${preferredMachine}`);

      // SMART POLLING (ONLINE MACHINE)
      pollRef.current = setInterval(async () => {
        try {
          const profileRes = await API.get(`/api/user/profile/${encodeURIComponent(userRollNo)}`);
          const liveState = profileRes.data.profile.currentState;

          if (liveState !== initialDBState) {
            console.log(`[POLL] Success! State changed: ${initialDBState} -> ${liveState}`);
            clearTimers();
            playSuccessSound();
            setScanSuccess(true);
            toast.success("Gate scan verified automatically! 🟢");

            // Delay navigation to show animation
            setTimeout(() => {
              if (allocatedPassType === "IN") {
                window.location.reload();
              } else {
                navigate("/");
              }
            }, 2500);
          }
        } catch (err) {
          console.error("Polling failed", err);
        }
      }, 3000);

      // VISUAL COUNTDOWN & OFFLINE TIMEOUT
      countdownRef.current = setInterval(async () => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearTimers();
            // Hardware now manages state internally. 
            // We just expire the screen here.
            navigate("/");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // ... remaining logic ...
    } catch (err: any) {
      console.error("QR Allocation Error:", err);
      if (err.response?.status === 404) {
        toast.error("No approved access request found. Redirecting...");
        navigate("/user/request");
        return;
      }
      toast.error(err.response?.data?.message || "Failed to fetch secure QR pass");
    } finally {
      setLoading(false);
    }
  };

  // Semantic Theming based on pass type
  const isEntry = passType === 'IN';
  const themeColor = isEntry ? 'text-emerald-500' : 'text-blue-500';
  const themeBg = isEntry ? 'bg-emerald-500/10' : 'bg-blue-500/10';
  const themeBorder = isEntry ? 'border-emerald-500/30' : 'border-blue-500/30';

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col bg-slate-50/50">
      <DecorationBackground />

      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center p-4 pt-24 pb-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`glass-card w-full max-w-sm relative transition-all duration-700 ease-out 
          shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2.5rem] overflow-hidden
          ${qrString ? themeBorder : 'border-white/20'}`}
        >

          {/* Subtle top glow */}
          <div className={`absolute top-0 inset-x-0 h-1 ${qrString ? (isEntry ? 'bg-emerald-500' : 'bg-blue-500') : 'bg-primary/50'} transition-colors duration-500`} />

          <div className="p-8 text-center">
            {/* Restriction Overlay/Warning */}
            {restrictionUntil && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl animate-in fade-in slide-in-from-top-4">
                <div className="flex items-center justify-center gap-2 text-destructive mb-2">
                  <XCircle className="w-5 h-5" />
                  <p className="font-bold text-sm">Access Restricted</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Suspicious activity detected. Access restricted until{" "}
                  <span className="font-bold text-foreground">
                    {new Date(restrictionUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </p>
                <Button 
                   variant="outline" 
                   size="sm" 
                   className="mt-4 border-destructive/30 hover:bg-destructive/10"
                   onClick={() => navigate("/user/dashboard")}
                >
                  Return to Dashboard
                </Button>
              </div>
            )}

            {isFlagged && qrString && (
              <div className="mb-6 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-start gap-3 text-left animate-in fade-in duration-500">
                <span className="text-lg">🚩</span>
                <div>
                  <p className="text-xs font-bold text-orange-600 uppercase tracking-wider">Account Flagged</p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                    {flagReason || "Suspicious pattern detected."}
                  </p>
                </div>
              </div>
            )}
            {!qrString ? (
              // ----------------------------------------------------
              // 1. READY TO SCAN SCREEN
              // ----------------------------------------------------
              <div className="py-6 flex flex-col items-center">
                {/* Visual Placeholder Container */}
                <div className="relative mb-10 group">
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.05, 1],
                      opacity: [0.5, 0.8, 0.5] 
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full" 
                  />
                  
                  <div className="w-28 h-28 bg-white/40 backdrop-blur-md border border-white/40 rounded-[2.5rem] flex items-center justify-center relative shadow-2xl overflow-hidden group-hover:scale-105 transition-transform duration-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                    <motion.div
                       animate={{ 
                         opacity: [0.3, 0.6, 0.3],
                         y: [-20, 20, -20]
                       }}
                       transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                       className="absolute inset-x-0 h-0.5 bg-primary/50 shadow-[0_0_10px_#3b82f6] z-10"
                    />
                    <QrCode className="w-14 h-14 text-primary relative z-0" />
                  </div>
                </div>

                <motion.h2 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl font-black text-foreground mb-4 tracking-tighter"
                >
                  Access Terminal
                </motion.h2>
                
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-muted-foreground text-sm font-medium mb-12 px-6 leading-relaxed text-center"
                >
                  Stand near the hardware scanner and click below to generate your secure, single-use access token.
                </motion.p>

                <Button
                  size="lg"
                  onClick={generateToken}
                  disabled={loading}
                  className="w-full rounded-2xl h-16 text-lg font-bold shadow-xl btn-gradient relative overflow-hidden group/btn px-8"
                >
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000 skew-x-[-20deg]" />
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin mr-3" />
                      Securing...
                    </>
                  ) : (
                    <>
                      <ScanFace className="w-6 h-6 mr-3 group-hover/btn:scale-110 transition-transform" />
                      Generate Pass
                    </>
                  )}
                </Button>
              </div>
            ) : (
              // ----------------------------------------------------
              // 2. ACTIVE QR SCREEN
              // ----------------------------------------------------
              <div className="flex flex-col items-center">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`inline-flex items-center justify-center px-4 py-1.5 rounded-full font-bold text-[10px] mb-8 tracking-[0.2em] ${themeBg} ${themeColor} border ${themeBorder} uppercase`}
                >
                  {isEntry ? 'Entry Authorized' : 'Exit Authorized'}
                </motion.div>

                {/* QR Code Container with scanning effect illusion */}
                <div className="relative p-6 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 mb-8 group overflow-hidden">
                  <div className="relative z-10">
                    <QRCode value={qrString || ""} size={220} level="H" />
                  </div>
                  
                  {/* Subtle inner glow */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-slate-50 to-white pointer-events-none" />
                  
                  {/* Scanning laser line animation */}
                  <div className="absolute inset-0 overflow-hidden rounded-[2.5rem] pointer-events-none z-20">
                    <motion.div 
                      animate={{ 
                        top: ['0%', '100%', '0%'],
                        opacity: [0, 1, 0] 
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className={`w-full h-1 ${isEntry ? 'bg-emerald-500' : 'bg-blue-500'} shadow-[0_0_15px_rgba(0,0,0,0.5)] absolute top-0`} 
                    />
                  </div>
                </div>

                <div className="w-full space-y-6">
                  <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground bg-slate-50/50 py-3 px-5 rounded-2xl border border-slate-100">
                    <span className="uppercase tracking-widest opacity-60">Terminal</span>
                    <span className="text-foreground">{targetMachine}</span>
                  </div>

                  {/* Countdown & Progress */}
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between text-[11px] font-bold text-muted-foreground px-1">
                      <span className="uppercase tracking-wider">Awaiting Scan</span>
                      <span className={countdown <= 5 ? 'text-destructive animate-pulse' : 'text-primary'}>{countdown}s</span>
                    </div>
                    <div className="relative h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: '100%' }}
                        animate={{ width: `${(countdown / 20) * 100}%` }}
                        transition={{ duration: 1, ease: "linear" }}
                        className={`absolute left-0 top-0 h-full ${countdown <= 5 ? 'bg-destructive' : 'bg-primary'} transition-colors duration-500`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* --- SCAN SUCCESS OVERLAY --- */}
        <AnimatePresence>
          {scanSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-white/95 backdrop-blur-3xl px-6"
            >
              <div className="flex flex-col items-center max-w-sm w-full text-center">
                {/* Decorative Background for Success */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                   <motion.div 
                     animate={{ 
                       scale: [1, 1.2, 1],
                       rotate: [0, 90, 0]
                     }}
                     transition={{ duration: 10, repeat: Infinity }}
                     className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-emerald-500/10 rounded-full blur-[100px]" 
                   />
                   <motion.div 
                     animate={{ 
                       scale: [1, 1.3, 1],
                       rotate: [0, -90, 0]
                     }}
                     transition={{ duration: 12, repeat: Infinity }}
                     className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-primary/10 rounded-full blur-[100px]" 
                   />
                </div>

                {/* Checkmark Animation Container */}
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 260, 
                    damping: 20,
                    delay: 0.1 
                  }}
                  className="w-40 h-40 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_20px_50px_rgba(16,185,129,0.3)] mb-12 relative z-10"
                >
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-[-20px] bg-emerald-500/20 rounded-full" 
                  />
                  <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="80"
                    height="80"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="relative z-20"
                  >
                    <motion.path
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                      d="M20 6L9 17L4 12"
                    />
                  </motion.svg>
                </motion.div>

                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-5xl font-black text-foreground mb-4 tracking-tighter"
                >
                  SUCCESS
                </motion.h1>

                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-muted-foreground text-xl font-bold tracking-tight"
                >
                  Access Granted. Welcome {isEntry ? "Inside" : "Back"}!
                </motion.p>
                
                <motion.div 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   transition={{ delay: 1.5 }}
                   className="mt-16 flex items-center gap-3 text-emerald-600 bg-emerald-50 px-6 py-3 rounded-full border border-emerald-100"
                >
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-bold uppercase tracking-widest">Redirecting</span>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Required for the scanning animation */}
      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default ViewMyQR;