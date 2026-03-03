import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Copy, Clock, Loader2, XCircle, Calendar as CalendarIcon, User, MapPin } from "lucide-react";
import { toast } from "sonner";

import Navbar from "@/components/layout/Navbar";
import API from "@/api/api";
import ContributionCalendar from "@/components/ContributionCalendar";

import QRCode from "react-qr-code";

const UserDashboard = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("in");
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [error, setError] = useState(false);
  const [activeQRData, setActiveQRData] = useState<any>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendar, setCalendar] = useState<any[]>([]);
  const [qrRevealed, setQrRevealed] = useState(false);

  // Geofencing States
  const [isNearMachine, setIsNearMachine] = useState(false);
  const [locationError, setLocationError] = useState<string | null>("Detecting location...");

  // ✅ Read ID Number
  const [params] = useSearchParams();
  const idNumber =
    params.get("id") || localStorage.getItem("userIdNumber") || "";

  // ✅ Geofencing Logic
  const MACHINE_LAT = parseFloat(import.meta.env.VITE_MACHINE_LATITUDE || "28.749685");
  const MACHINE_LNG = parseFloat(import.meta.env.VITE_MACHINE_LONGITUDE || "77.113849");
  const MAX_DISTANCE_KM = 1;

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    
    console.log(lat1, lon1, lat2, lon2)
    const R = 6371; // Radius of earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

   const watchId = navigator.geolocation.watchPosition(
  (position) => {
    const { latitude, longitude, accuracy } = position.coords;

    console.log("Coords:", latitude, longitude, "Accuracy:", accuracy);

    // ❗ Ignore inaccurate locations
    if (accuracy > 200) {
      setLocationError("Waiting for accurate GPS location...");
      return;
    }

    const dist = getDistance(
      latitude,
      longitude,
      MACHINE_LAT,
      MACHINE_LNG
    );

    setIsNearMachine(dist <= MAX_DISTANCE_KM);

    setLocationError(
      dist <= MAX_DISTANCE_KM
        ? null
        : `You are ${dist.toFixed(2)}km away.`
    );
  },
  (error) => {
    setIsNearMachine(false);

    if (error.code === error.PERMISSION_DENIED) {
      setLocationError(
        "Location permission denied. Enable it in browser settings."
      );
    } else {
      setLocationError("Unable to retrieve your location.");
    }
  },
  {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0
  }
);

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  /**
   * ✅ Fetch QR Pass Data with Auto-Refresh Polling
   * Polls every 5 seconds until approved or rejected
   */
  useEffect(() => {
    setQrRevealed(false);
  }, [activeQRData?.activeQRType]);

  useEffect(() => {
    if (!idNumber) {
      setError(true);
      setLoading(false);
      return;
    }

    let interval: any;

    const fetchUserData = async () => {
      try {
        const response = await API.get(
          `/api/user/qrpass-by-id/${idNumber}`
        );

        setUserData(response.data);
        setLoading(false);

        // ✅ Stop polling if approved/rejected
        if (response.data.status !== "PENDING") {
          clearInterval(interval);
        }
      } catch (err) {
        setError(true);
        setLoading(false);
      }
    };

    // ✅ First call immediately
    fetchUserData();

    // ✅ Poll every 5 seconds until approved/rejected
    interval = setInterval(fetchUserData, 5000);

    return () => clearInterval(interval);
  }, [idNumber]);

  /**
   * ✅ Fetch Active QR (Dynamic Rotation) - Polls every 5 seconds
   */
  useEffect(() => {
    if (!idNumber || userData?.status !== "APPROVED") return;

    let qrInterval: any;

    const fetchActiveQR = async () => {
      try {
        const response = await API.get(`/api/user/active-qr/${idNumber}`);
        setActiveQRData(response.data);

        // Auto-switch tab to active QR
        if (response.data.activeQRType) {
          setActiveTab(response.data.activeQRType.toLowerCase());
        }
      } catch (err) {
        console.error("Active QR fetch error:", err);
      }
    };

    fetchActiveQR();
    qrInterval = setInterval(fetchActiveQR, 5000); // Poll every 5 seconds

    return () => clearInterval(qrInterval);
  }, [idNumber, userData?.status]);

  /**
   * ✅ Fetch Contribution Calendar
   */
  const fetchCalendar = async () => {
    try {
      const response = await API.get(`/api/user/calendar/${idNumber}`);
      setCalendar(response.data.calendar || []);
      setShowCalendar(true);
    } catch (err) {
      toast.error("Failed to load calendar");
    }
  };

  /**
   * ✅ Copy Token (Optional)
   */
  const copyToken = () => {
    const token = activeQRData?.qrToken;

    if (!token) {
      toast.error("QR not available yet");
      return;
    }

    navigator.clipboard.writeText(token);
    toast.success("QR token copied!");
  };

  /**
   * ✅ Format Date Safe
   */
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";

    return new Date(dateStr).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  /**
   * ✅ Loading Screen
   */
  if (loading) {
    return (
      <div className="min-h-screen bg-hero-gradient">
        <Navbar />
        <div className="container mx-auto px-4 pt-24">
          <div className="max-w-lg mx-auto glass-card p-10 text-center">
            <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">
              Loading your access pass...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /**
   * ✅ PENDING - Approval Pending Screen
   */
  if (userData?.status === "PENDING") {
    return (
      <div className="min-h-screen bg-hero-gradient">
        <Navbar />
        <div className="container mx-auto px-4 pt-24">
          <div className="max-w-lg mx-auto glass-card p-10 text-center">
            <Clock className="w-10 h-10 text-warning mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Approval Pending</h2>
            <p className="text-muted-foreground">
              Your request is under admin review. Please check back later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /**
   * ✅ REJECTED - Show Rejection Reason
   */
  if (userData?.status === "REJECTED") {
    return (
      <div className="min-h-screen bg-hero-gradient">
        <Navbar />
        <div className="container mx-auto px-4 pt-24">
          <div className="max-w-lg mx-auto glass-card p-10 text-center">
            <XCircle className="w-10 h-10 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-4">Request Rejected</h2>
            {userData.rejectionReason && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium mb-1">Reason:</p>
                <p className="text-sm text-foreground">
                  {userData.rejectionReason}
                </p>
              </div>
            )}
            <p className="text-muted-foreground text-sm">
              Please contact admin for more information.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /**
   * ✅ Error - No data
   */
  if (error || !userData) {
    return (
      <div className="min-h-screen bg-hero-gradient">
        <Navbar />
        <div className="container mx-auto px-4 pt-24">
          <div className="max-w-lg mx-auto glass-card p-10 text-center">
            <Clock className="w-10 h-10 text-warning mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Data Not Available</h2>
            <p className="text-muted-foreground">
              Unable to load your access information. Please try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /**
   * ✅ EXPIRED - Show Expiration Message
   */
  const isExpired = userData?.validUntil && new Date(userData.validUntil) < new Date();

  if (userData?.status === "APPROVED" && isExpired) {
    return (
      <div className="min-h-screen bg-hero-gradient">
        <Navbar />
        <div className="container mx-auto px-4 pt-24">
          <div className="max-w-lg mx-auto glass-card p-10 text-center">
            <XCircle className="w-10 h-10 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Pass Expired</h2>
            <p className="text-muted-foreground mb-6">
              Your access pass expired on {formatDate(userData.validUntil)}.
              Please request a new pass.
            </p>
            <Button onClick={() => navigate("/user/request")} className="w-full h-12">
              Make New QR Request
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /**
   * ✅ APPROVED - Show QR Dashboard
   */
  return (
    <div className="min-h-screen bg-hero-gradient">
      <Navbar />

      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-lg mx-auto">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold">
                Your Gate Access Pass
              </h1>
              <p className="text-muted-foreground">
                Scan QR at the gate
              </p>
            </div>

            {/* Restriction Warning */}
            {activeQRData?.status === "RESTRICTED" && (
              <div className="bg-destructive/10 border border-destructive rounded-xl p-4 mb-6">
                <p className="text-destructive font-semibold">⚠️ Temporarily Restricted</p>
                <p className="text-sm text-muted-foreground">
                  Multiple rapid scans detected. Access restricted until{" "}
                  {new Date(activeQRData.restrictionUntil).toLocaleTimeString()}
                </p>
              </div>
            )}

            {/* Card */}
            <div className="qr-card">
              {/* Validity */}
              <div className="bg-muted/40 p-4 rounded-xl mb-6">
                <div className="flex justify-between text-sm">
                  <div>
                    <p className="text-muted-foreground">Valid From</p>
                    <p className="font-medium">
                      {formatDate(userData.validFrom)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-muted-foreground">Valid Until</p>
                    <p className="font-medium">
                      {formatDate(userData.validUntil)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dynamic QR Notice */}
              {activeQRData?.activeQRType && (
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 mb-4 text-center">
                  <p className="text-xs text-primary font-semibold">
                    🔄 Active QR: {activeQRData.activeQRType}
                  </p>
                </div>
              )}

              {/* Geofence Check */}
              {!isNearMachine ? (
                <div className="bg-destructive/10 border border-destructive rounded-xl p-6 mb-6 text-center">
                  <MapPin className="w-8 h-8 mx-auto text-destructive mb-3" />
                  <p className="text-destructive font-semibold mb-1">
                    {locationError?.includes("denied") ? "Location Required" : "Too far from gate"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {locationError || "You must be within 1km of the machine to view your QR pass."}
                  </p>
                </div>
              ) : (
                <>
                  {/* Tabs */}
                  <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full"
                  >
                    <TabsList className="grid grid-cols-2 h-12 mb-6">
                      <TabsTrigger value="in" disabled={activeQRData?.activeQRType !== "IN"}>
                        <ArrowRight className="w-4 h-4 mr-1" />
                        IN QR
                      </TabsTrigger>

                      <TabsTrigger value="out" disabled={activeQRData?.activeQRType !== "OUT"}>
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        OUT QR
                      </TabsTrigger>
                    </TabsList>

                    {/* ✅ IN QR */}
                    <TabsContent value="in">
                      {activeQRData?.activeQRType === "IN" && activeQRData?.qrToken ? (
                        <div
                          className="relative bg-white rounded-2xl p-8 flex justify-center cursor-pointer"
                          onClick={() => setQrRevealed(true)}
                        >
                          <div className={`${!qrRevealed ? "blur-xl" : ""}`}>
                            <QRCode value={activeQRData.qrToken} size={220} />
                          </div>

                          {!qrRevealed && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <p className="text-sm font-semibold text-primary">
                                Tap to Reveal QR
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-muted/20 rounded-2xl p-8 text-center border border-dashed">
                          <Clock className="w-6 h-6 mx-auto mb-3 text-muted-foreground" />
                          <p className="text-muted-foreground text-sm">
                            IN QR not active. Wait for rotation...
                          </p>
                        </div>
                      )}
                    </TabsContent>

                    {/* ✅ OUT QR */}
                    <TabsContent value="out">
                      {activeQRData?.activeQRType === "OUT" && activeQRData?.qrToken ? (
                        <div
                          className="relative bg-white rounded-2xl p-8 flex justify-center cursor-pointer"
                          onClick={() => setQrRevealed(true)}
                        >
                          <div className={`${!qrRevealed ? "blur-xl" : ""}`}>
                            <QRCode value={activeQRData.qrToken} size={220} />
                          </div>

                          {!qrRevealed && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <p className="text-sm font-semibold text-primary">
                                Tap to Reveal QR
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-muted/20 rounded-2xl p-8 text-center border border-dashed">
                          <Clock className="w-6 h-6 mx-auto mb-3 text-muted-foreground" />
                          <p className="text-muted-foreground text-sm">
                            OUT QR not active. Wait for rotation...
                          </p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>

                  {/* Copy Button */}
                  <Button
                    variant="outline"
                    onClick={copyToken}
                    className="w-full mt-6"
                    disabled={!activeQRData?.qrToken}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Token
                  </Button>
                </>
              )}

              {/* View Calendar Button */}
              <Button
                variant="secondary"
                onClick={fetchCalendar}
                className="w-full mt-3"
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                View My Activity Calendar
              </Button>

              {/* View Profile Button */}
              <Button
                variant="outline"
                onClick={() => navigate("/user/profile")}
                className="w-full mt-3"
              >
                <User className="w-4 h-4 mr-2" />
                Edit My Profile
              </Button>
            </div>

            {/* Contribution Calendar */}
            {showCalendar && calendar.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>My Activity Calendar</CardTitle>
                </CardHeader>
                <CardContent>
                  <ContributionCalendar activities={calendar} />
                </CardContent>
              </Card>
            )}

            {/* Footer */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              {userData.organisation}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
