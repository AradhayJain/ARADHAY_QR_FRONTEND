import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { motion } from "framer-motion";
import { ArrowLeft, Mail, Loader2, Shield, Lock, User, Monitor, Cpu, ChevronRight, Building, Briefcase, Hash, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

import {
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

import { auth } from "../auth/firebase";
import API from "@/api/api";

const Login = () => {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [googleUserReady, setGoogleUserReady] = useState(false);
  const [googleUserData, setGoogleUserData] = useState<any>(null);

  // User details form
  const [userDetails, setUserDetails] = useState({
    fullName: "",
    organisation: "",
    designation: "",
    rollNo: "",
    preferredMachineId: "",
  });

  const [adminFormData, setAdminFormData] = useState({
    email: "",
    password: "",
  });

  const [availableMachines, setAvailableMachines] = useState<string[]>([]);
  const [rollNoAvailable, setRollNoAvailable] = useState<boolean | null>(null);
  const [isCheckingRoll, setIsCheckingRoll] = useState(false);

  useEffect(() => {
    // Fetch dynamic machine list for the dropdown
    const fetchMachines = async () => {
      try {
        const response = await API.get("/api/user/machines");
        if (response.data.success && response.data.machines) {
          setAvailableMachines(response.data.machines);
        }
      } catch (err) {
        console.error("Failed to load machines:", err);
      }
    };
    fetchMachines();
  }, []);

  // Debounced Roll No Check
  useEffect(() => {
    if (!userDetails.rollNo || userDetails.rollNo.length < 3) {
      setRollNoAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingRoll(true);
      try {
        const response = await API.get(`/api/user/check-rollno/${userDetails.rollNo}?uid=${googleUserData?.uid || ""}`);
        setRollNoAvailable(response.data.available);
      } catch (err) {
        console.error("Check failed", err);
      } finally {
        setIsCheckingRoll(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [userDetails.rollNo, googleUserData?.uid]);

  /**
   * ✅ Google Login (First Step)
   */
  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      const token = await result.user.getIdToken();

      const userData = {
        uid: result.user.uid,
        email: result.user.email,
        token,
        method: "google",
      };

      setGoogleUserData(userData);

      // Check if user already exists
      try {
        const response = await API.get("/api/user/check-profile", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.exists) {
          const finalUserData = {
            ...userData,
            ...response.data.data
          };
          
          localStorage.setItem("focusdesk_user", JSON.stringify(finalUserData));
          localStorage.setItem("userIdNumber", finalUserData.rollNo);
          toast.success("✅ Logged in successfully!");
          navigate("/");
          return;
        }
      } catch (err) {
        console.error("Error checking profile:", err);
      }

      setGoogleUserReady(true);
      toast.success("✅ Google Authentication Successful! Please complete your profile.");
    } catch (err) {
      console.log(err);
      toast.error("Google Login Failed");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * ✅ Complete Profile (Second Step)
   */
  const handleUserDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userDetails.fullName || !userDetails.organisation || !userDetails.designation || !userDetails.rollNo || !userDetails.preferredMachineId) {
      toast.error("Please fill in all details including preferred machine");
      return;
    }

    if (rollNoAvailable === false) {
      toast.error("The selected Roll Number / ID is already taken");
      return;
    }

    setIsLoading(true);
    
    try {
      // ✅ Save to backend first
      await API.post("/api/user/profile-setup", {
        ...userDetails,
        email: googleUserData?.email
      }, {
        headers: { Authorization: `Bearer ${googleUserData?.token}` }
      });
      
      localStorage.setItem(
        "focusdesk_user",
        JSON.stringify({
          ...googleUserData,
          ...userDetails,
        })
      );
      localStorage.setItem("userIdNumber", userDetails.rollNo);
      toast.success("✅ Profile Completed & Logged In!");
      navigate("/");
    } catch (err: any) {
      console.error("Profile setup failed", err.response?.data || err.message);
      toast.error(err.response?.data?.message || err.response?.data?.error || "Failed to save profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setUserDetails((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  /**
   * ✅ Admin Login
   */
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminFormData.email || !adminFormData.password) {
      toast.error("Please fill in all fields");
      return;
    }
    // Strict admin credentials check
    if (
      adminFormData.email !== "focusdesk@admin" ||
      adminFormData.password !== "admin@602"
    ) {
      toast.error("Invalid admin credentials");
      return;
    }
    setIsLoading(true);
    // Simulate login
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    toast.success("Welcome, Admin!");
    navigate("/admin/dashboard");
  };

  const handleAdminChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAdminFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4">
      {/* Background decoration mirroring AdminLogin */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Back */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="glass-card p-8">
          <h1 className="text-2xl font-bold text-center mb-6">
            Login to FocusDesk
          </h1>

          <Tabs defaultValue="user">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="user">
                <User className="w-4 h-4 mr-2" />
                User Login
              </TabsTrigger>
              <TabsTrigger value="admin">
                <Shield className="w-4 h-4 mr-2" />
                Admin Login
              </TabsTrigger>
            </TabsList>

            {/* ✅ USER LOGIN */}
            <TabsContent value="user" className="mt-6">
              {!googleUserReady ? (
                <Button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full h-12"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin mr-2" />
                  ) : (
                    <Mail className="w-4 h-4 mr-2" />
                  )}
                  Continue with Google
                </Button>
              ) : (
                <form onSubmit={handleUserDetailsSubmit} className="space-y-4">
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <div className="relative">
                        <Input
                          id="fullName"
                          name="fullName"
                          placeholder="John Doe"
                          value={userDetails.fullName}
                          onChange={handleUserDetailsChange}
                          required
                          className="pl-10 h-11 bg-white/5 border-white/10 focus:border-primary/50 transition-all"
                        />
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="organisation">Organisation</Label>
                        <div className="relative">
                          <Input
                            id="organisation"
                            name="organisation"
                            placeholder="Company / College"
                            value={userDetails.organisation}
                            onChange={handleUserDetailsChange}
                            required
                            className="pl-10 h-11 bg-white/5 border-white/10 focus:border-primary/50 transition-all"
                          />
                          <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="designation">Designation</Label>
                        <div className="relative">
                          <Input
                            id="designation"
                            name="designation"
                            placeholder="Student / Employee"
                            value={userDetails.designation}
                            onChange={handleUserDetailsChange}
                            required
                            className="pl-10 h-11 bg-white/5 border-white/10 focus:border-primary/50 transition-all"
                          />
                          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rollNo">Roll No / ID</Label>
                      <div className="relative">
                        <Input
                          id="rollNo"
                          name="rollNo"
                          placeholder="e.g. 123456"
                          value={userDetails.rollNo}
                          onChange={handleUserDetailsChange}
                          required
                          className={`pl-10 h-11 bg-white/5 border-white/10 focus:border-primary/50 transition-all ${
                            rollNoAvailable === false ? "border-destructive/50 focus:border-destructive" : 
                            rollNoAvailable === true ? "border-green-500/50 focus:border-green-500" : ""
                          }`}
                        />
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {isCheckingRoll ? (
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          ) : rollNoAvailable === true ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : rollNoAvailable === false ? (
                            <XCircle className="w-4 h-4 text-destructive" />
                          ) : null}
                        </div>
                      </div>
                      {rollNoAvailable === false && (
                        <p className="text-[10px] text-destructive font-medium ml-1">
                          This ID is already registered to another account.
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="preferredMachineId">Preferred Machine</Label>
                      <Select 
                        value={userDetails.preferredMachineId} 
                        onValueChange={(value) => setUserDetails({...userDetails, preferredMachineId: value})} 
                        required
                      >
                        <SelectTrigger className="h-11 bg-white/5 border-white/10 focus:ring-primary/50 transition-all">
                          <div className="flex items-center gap-2">
                            <Monitor className="w-4 h-4 text-primary" />
                            <SelectValue placeholder="Identify your entry gate" />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="glass-card border-white/20 backdrop-blur-xl">
                          {availableMachines.length > 0 ? (
                            availableMachines.map((m) => (
                              <SelectItem key={m} value={m} className="py-3 cursor-pointer focus:bg-primary/10 transition-colors">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                    {m.toLowerCase().includes('gate') ? <Monitor className="w-4 h-4" /> : <Cpu className="w-4 h-4" />}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {m.includes("_") ? m.replace(/_/g, " ") : m}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                      Hardware ID: {m.slice(0, 8)}
                                    </span>
                                  </div>
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <>
                              <SelectItem value="GATE_A_MAIN" className="py-3">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                    <Monitor className="w-4 h-4" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-medium">GATE A MAIN</span>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Primary Entrance</span>
                                  </div>
                                </div>
                              </SelectItem>
                              <SelectItem value="GATE_B_MAIN" className="py-3">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                    <Monitor className="w-4 h-4" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-medium">GATE B MAIN</span>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Secondary Exit</span>
                                  </div>
                                </div>
                              </SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 mt-6 btn-gradient font-semibold tracking-wide"
                  >
                    {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : "Finalize Profile"}
                  </Button>
                </form>
              )}
            </TabsContent>

            {/* ✅ ADMIN LOGIN */}
            <TabsContent value="admin" className="mt-6 space-y-4">
              <form onSubmit={handleAdminSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="admin@focusdesk.com"
                    value={adminFormData.email}
                    onChange={handleAdminChange}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Enter your password"
                      value={adminFormData.password}
                      onChange={handleAdminChange}
                      className="h-12 pr-10"
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 btn-gradient"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
              <p className="text-xs text-muted-foreground text-center mt-6">
                Authorized personnel only. All access is logged and monitored.
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
