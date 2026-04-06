import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { Loader2, QrCode, ScanFace, CheckCircle2, XCircle, DoorOpen } from "lucide-react";
import { toast } from "sonner";
import API from "@/api/api";
import { Button } from "@/components/ui/button";
import QRCode from "react-qr-code";
import { Progress } from "@/components/ui/progress";

const ViewMyQR = () => {
  const navigate = useNavigate();

  const [qrString, setQrString] = useState<string | null>(null);
  const [passType, setPassType] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [targetMachine, setTargetMachine] = useState<string | null>(null);

  const [countdown, setCountdown] = useState(20);

  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

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

      const res = await API.post("/api/user/allocate-qr", {
        idNumber: userRollNo,
        machineId: preferredMachine
      });

      const { qrData, passType: allocatedPassType, currentState: initialDBState } = res.data;

      setQrString(qrData);
      setPassType(allocatedPassType);
      toast.success(`Access Pass Allocated for ${preferredMachine}`);

      // SMART POLLING (ONLINE MACHINE)
      pollRef.current = setInterval(async () => {
        try {
          const profileRes = await API.get(`/api/user/profile/${encodeURIComponent(userRollNo)}`);
          const liveState = profileRes.data.profile.currentState;

          if (liveState !== initialDBState) {
            clearTimers();
            toast.success("Gate scan verified automatically! 🟢");

            if (allocatedPassType === "IN") {
              window.location.reload();
            } else {
              navigate("/");
            }
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
            if (allocatedPassType === "IN") {
              setShowConfirm(true);
            } else {
              // executeAutoExit(userRollNo);
              navigate("/");

            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (err: any) {
      console.error("QR Allocation Error:", err);
      toast.error(err.response?.data?.message || "Failed to fetch secure QR pass");
    } finally {
      setLoading(false);
    }
  };

  const executeAutoExit = async (rollNo: string) => {
    try {
      await API.post("/api/user/confirm-entry", {
        idNumber: rollNo,
        enteredSuccessfully: true
      });
      toast.success("Exit logged successfully. Have a great day!");
    } catch (err) {
      console.error("Auto-exit failed", err);
    } finally {
      navigate("/");
    }
  };

  const handleConfirmation = async (success: boolean) => {
    const userStr = localStorage.getItem("focusdesk_user");
    const userRollNo = userStr ? JSON.parse(userStr).rollNo || JSON.parse(userStr).idNumber : null;

    try {
      await API.post("/api/user/confirm-entry", {
        idNumber: userRollNo,
        enteredSuccessfully: success
      });

      toast.success(success ? "Location state updated!" : "Access pass released.");
      setShowConfirm(false);
      window.location.reload();
    } catch (err) {
      toast.error("Failed to update status.");
    }
  };

  // Semantic Theming based on pass type
  const isEntry = passType === 'IN';
  const themeColor = isEntry ? 'text-emerald-500' : 'text-blue-500';
  const themeBg = isEntry ? 'bg-emerald-500/10' : 'bg-blue-500/10';
  const themeBorder = isEntry ? 'border-emerald-500/30' : 'border-blue-500/30';

  return (
    <div className="min-h-screen bg-hero-gradient flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center p-4 pt-24 pb-12">
        <div className={`glass-card w-full max-w-sm relative transition-all duration-500 ease-out 
          bg-card/90 backdrop-blur-xl border shadow-2xl rounded-[2rem] overflow-hidden
          ${qrString ? themeBorder : 'border-border'}`}>

          {/* Subtle top glow */}
          <div className={`absolute top-0 inset-x-0 h-1 ${qrString ? (isEntry ? 'bg-emerald-500' : 'bg-blue-500') : 'bg-primary/50'} transition-colors duration-500`} />

          <div className="p-8 text-center">
            {showConfirm ? (
              // ----------------------------------------------------
              // 1. CONFIRMATION SCREEN
              // ----------------------------------------------------
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mx-auto w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-6 shadow-inner border border-border">
                  <DoorOpen className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-foreground tracking-tight">Did the gate open?</h3>
                <p className="text-muted-foreground text-sm mb-8 px-2">
                  Please confirm if you successfully passed through the gate so we can update your live location.
                </p>
                <div className="flex flex-col gap-3 w-full">
                  <Button
                    size="lg"
                    className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/10 font-semibold text-lg"
                    onClick={() => handleConfirmation(true)}
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Yes, I entered
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full rounded-2xl"
                    onClick={() => handleConfirmation(false)}
                  >
                    <XCircle className="w-5 h-5 mr-2" />
                    No, it failed
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {!qrString ? (
                  // ----------------------------------------------------
                  // 2. READY TO SCAN SCREEN
                  // ----------------------------------------------------
                  <div className="py-4 flex flex-col items-center animate-in fade-in duration-700">
                    <div className="relative mb-8">
                      <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                      <div className="w-24 h-24 bg-secondary/80 border border-border rounded-3xl flex items-center justify-center relative shadow-xl">
                        <QrCode className="w-12 h-12 text-foreground/70" />
                      </div>
                    </div>

                    <h2 className="text-2xl font-bold text-foreground mb-3 tracking-tight">Access Terminal</h2>
                    <p className="text-muted-foreground text-sm mb-10 px-2 leading-relaxed">
                      Stand near the hardware scanner and click below to generate your secure, single-use access token.
                    </p>

                    <Button
                      size="lg"
                      onClick={generateToken}
                      disabled={loading}
                      className="w-full rounded-2xl h-14 text-lg font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-3" />
                          Securing Token...
                        </>
                      ) : (
                        <>
                          <ScanFace className="w-5 h-5 mr-3" />
                          Generate Pass
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  // ----------------------------------------------------
                  // 3. ACTIVE QR SCREEN
                  // ----------------------------------------------------
                  <div className="animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center">

                    <div className={`inline-flex items-center justify-center px-4 py-1.5 rounded-full font-bold text-xs mb-6 tracking-widest ${themeBg} ${themeColor} border ${themeBorder}`}>
                      {isEntry ? 'ENTRY AUTHORIZED' : 'EXIT AUTHORIZED'}
                    </div>

                    {/* QR Code Container with scanning effect illusion */}
                    <div className="relative p-5 bg-white rounded-3xl shadow-lg border-2 border-slate-100 mb-6 group">
                      <QRCode value={qrString || ""} size={220} level="H" />
                      {/* Scanning laser line animation */}
                      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                        <div className={`w-full h-1 ${isEntry ? 'bg-emerald-500' : 'bg-blue-500'} shadow-[0_0_15px_rgba(0,0,0,0.3)] opacity-60 absolute top-0 animate-[scan_3s_ease-in-out_infinite]`} />
                      </div>
                    </div>

                    <div className="w-full space-y-4">
                      <div className="flex items-center justify-between text-xs font-mono text-muted-foreground bg-secondary/50 py-2 px-4 rounded-xl border border-border">
                        <span className="uppercase tracking-wider">Gate</span>
                        <span className="text-foreground font-semibold">{targetMachine}</span>
                      </div>

                      {/* Countdown & Progress */}
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between text-xs font-medium text-muted-foreground px-1">
                          <span>Awaiting Scan...</span>
                          <span className={countdown <= 5 ? 'text-destructive font-bold animate-pulse' : ''}>{countdown}s</span>
                        </div>
                        <Progress value={(countdown / 20) * 100} className="h-2" />
                      </div>

                      <p className="mt-4 text-xs font-mono text-muted-foreground truncate w-full px-2 text-center">
                        Payload: {qrString?.split('|')?.[0]?.substring(0, 13) || "Generating"}...
                      </p>
                    </div>

                  </div>
                )}
              </>
            )}
          </div>
        </div>
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