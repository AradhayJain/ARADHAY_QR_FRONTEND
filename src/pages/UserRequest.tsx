import React from "react";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, Clock } from "lucide-react";
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

  const [lockedFields, setLockedFields] = useState({
    fullName: false,
    collegeId: false,
    organisation: false,
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("focusdesk_user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setFormData((prev) => ({
          ...prev,
          fullName: parsedUser.fullName || prev.fullName,
          collegeId: parsedUser.rollNo || prev.collegeId,
          organisation: parsedUser.organisation || prev.organisation,
        }));
        setLockedFields({
          fullName: !!parsedUser.fullName,
          collegeId: !!parsedUser.rollNo,
          organisation: !!parsedUser.organisation,
        });
      } catch (error) {
        console.error("Failed to parse user data from localStorage", error);
      }
    }
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
    // if (formData.collegeId.includes("/")) {
    //   toast.error("Use format like 24CSE250 (no / allowed)");
    //   return;
    // }

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
    navigate(`/user/viewqr`);
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
                      readOnly={lockedFields.fullName}
                      className={`h-12 ${lockedFields.fullName ? "opacity-70 cursor-not-allowed bg-muted" : ""}`}
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
                      readOnly={lockedFields.collegeId}
                      className={`h-12 ${lockedFields.collegeId ? "opacity-70 cursor-not-allowed bg-muted" : ""}`}
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
                      readOnly={lockedFields.organisation}
                      className={`h-12 ${lockedFields.organisation ? "opacity-70 cursor-not-allowed bg-muted" : ""}`}
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
                    disabled={isLoading}
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
