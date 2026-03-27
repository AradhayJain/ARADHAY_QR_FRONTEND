import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "@/components/layout/Navbar";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import API from "@/api/api";

const ViewMyQR = () => {
  const navigate = useNavigate();
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    const checkQR = async () => {
      const userStr = localStorage.getItem("focusdesk_user");
      if (!userStr) {
        toast.error("Please login first");
        navigate("/login");
        return;
      }

      let rollNo = "";
      try {
        const user = JSON.parse(userStr);
        rollNo = user.rollNo;
      } catch (e) {
        toast.error("Invalid user data, please login again");
        navigate("/login");
        return;
      }

      if (!rollNo) {
        toast.error("Profile incomplete. Please login again.");
        navigate("/login");
        return;
      }

      try {
        const res = await API.get(`/api/user/qrpass-by-id/${encodeURIComponent(rollNo)}`);
        const qrData = res.data;

        localStorage.setItem("userIdNumber", rollNo);

        // Check if QR is expired
        const isExpired = qrData?.validUntil && new Date(qrData.validUntil).getTime() < Date.now();
        if (qrData?.status === "APPROVED" && isExpired) {
          toast.error("QR Expired. Please request a new one.");
          navigate("/user/request");
          return;
        }

        toast.success("QR Pass Found ✅");
        navigate(`/user/dashboard?id=${rollNo}`);
      } catch (err: any) {
        // If 404 or any other error, assume no QR found
        console.error("ViewMyQR fetch error details:", err.response?.data || err.message);
        toast.info(err.response?.data?.message || "No QR found. Please generate a new request.");
        navigate("/user/request");
      }
    };

    checkQR();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-hero-gradient">
      <Navbar />
      <div className="container mx-auto px-4 pt-28 pb-16 flex justify-center">
        <div className="glass-card p-10 text-center max-w-sm w-full mt-20">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Checking your QR status...</p>
        </div>
      </div>
    </div>
  );
};

export default ViewMyQR;
