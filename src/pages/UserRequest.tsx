import React from "react";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, Clock, MapPin } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/layout/Navbar";
import API from "@/api/api";

const UserRequest = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    collegeId: "",
    organisation: "",

    // ✅ NEW: User-selected validity range
    validFrom: "",
    validUntil: "",
  });

  // Geofencing States
  const [isNearMachine, setIsNearMachine] = useState(false);
  const [locationError, setLocationError] = useState<string | null>("Detecting location...");

  // ✅ Geofencing Logic
  const MACHINE_LAT = parseFloat(import.meta.env.VITE_MACHINE_LATITUDE || "28.749685");
  const MACHINE_LNG = parseFloat(import.meta.env.VITE_MACHINE_LONGITUDE || "77.113849");
  const MAX_DISTANCE_KM = 1;

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
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

  React.useEffect(() => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.fullName ||
      !formData.collegeId ||
      !formData.organisation ||
      !formData.validFrom ||
      !formData.validUntil
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    // ✅ Block slashes in roll number
    if (formData.collegeId.includes("/")) {
      toast.error("Use format like 24CSE250 (no / allowed)");
      return;
    }

    const validFromDate = new Date(formData.validFrom);
    const validUntilDate = new Date(formData.validUntil);

    if (Number.isNaN(validFromDate.getTime()) || Number.isNaN(validUntilDate.getTime())) {
      toast.error("Invalid date format");
      return;
    }

    // ✅ Validity check
    if (validFromDate >= validUntilDate) {
      toast.error("Valid Until must be after Valid From");
      return;
    }

    // ✅ Geofence check
    if (!isNearMachine) {
      toast.error(locationError || "You must be near the gate to submit a request.");
      return;
    }

    setIsLoading(true);

    try {
      await API.post("/api/user/request-access", {
        fullName: formData.fullName,
        idNumber: formData.collegeId,
        organisation: formData.organisation,

        // ✅ Send validity dates to backend
        validFrom: validFromDate.toISOString(),
        validUntil: validUntilDate.toISOString(),
      });

      setSubmitted(true);
      toast.success("Request submitted. Wait for admin approval.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Request failed");
    }

    setIsLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // ✅ Navigate to dashboard with ID stored
  const handleViewStatus = () => {
    localStorage.setItem("userIdNumber", formData.collegeId);
    navigate(`/user/dashboard?id=${formData.collegeId}`);
  };

  return (
    <div className="min-h-screen bg-hero-gradient">
      <Navbar />

      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {!submitted ? (
              <div className="glass-card p-8">
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-foreground mb-2">
                    Generate Your Access QR
                  </h1>
                  <p className="text-muted-foreground">
                    Fill in your details and select validity dates
                  </p>
                </div>

                {/* Geofence Notice */}
                {!isNearMachine && (
                  <div className="bg-destructive/10 border border-destructive rounded-xl p-4 mb-6 text-center">
                    <MapPin className="w-6 h-6 mx-auto text-destructive mb-2" />
                    <p className="text-sm font-semibold text-destructive mb-1">
                      {locationError?.includes("denied") ? "Location Required" : "Too far from gate"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {locationError || "You must be within 1km of the machine to request a QR pass."}
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="h-12"
                    />
                  </div>

                  {/* College ID */}
                  <div className="space-y-2">
                    <Label htmlFor="collegeId">College ID / Roll Number</Label>
                    <Input
                      id="collegeId"
                      name="collegeId"
                      type="text"
                      placeholder="24CSE250"
                      value={formData.collegeId}
                      onChange={handleChange}
                      className="h-12"
                    />
                  </div>

                  {/* Organisation */}
                  <div className="space-y-2">
                    <Label htmlFor="organisation">Organisation</Label>
                    <Input
                      id="organisation"
                      name="organisation"
                      type="text"
                      value={formData.organisation}
                      onChange={handleChange}
                      className="h-12"
                    />
                  </div>

                  {/* ✅ NEW: Validity Start */}
                  <div className="space-y-2">
                    <Label htmlFor="validFrom">Valid From</Label>
                    <Input
                      id="validFrom"
                      name="validFrom"
                      type="datetime-local"
                      value={formData.validFrom}
                      onChange={handleChange}
                      className="h-12"
                    />
                  </div>

                  {/* ✅ NEW: Validity End */}
                  <div className="space-y-2">
                    <Label htmlFor="validUntil">Valid Until</Label>
                    <Input
                      id="validUntil"
                      name="validUntil"
                      type="datetime-local"
                      value={formData.validUntil}
                      onChange={handleChange}
                      className="h-12"
                    />
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={isLoading || !isNearMachine}
                    className="w-full h-12 btn-gradient"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Submit Request
                      </>
                    )}
                  </Button>
                </form>
              </div>
            ) : (
              <div className="glass-card p-8 text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-warning/10 flex items-center justify-center mb-6">
                  <Clock className="w-10 h-10 text-warning" />
                </div>

                <h2 className="text-2xl font-bold mb-3">
                  Request Submitted!
                </h2>

                <p className="text-muted-foreground mb-6">
                  Your QR will activate only in your selected date range after approval.
                </p>

                <div className="space-y-3">
                  <Button onClick={handleViewStatus} className="w-full">
                    View Status
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => navigate("/")}
                    className="w-full"
                  >
                    Back to Home
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default UserRequest;
