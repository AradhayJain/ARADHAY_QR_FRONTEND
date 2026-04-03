import React, { useEffect, useState } from "react";
import API from "@/api/api";

interface AccessRequest {
  _id: string;
  validFrom: string;
  validUntil: string;
  createdAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  currentState: string;
}

const MyQRRequests: React.FC = () => {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRequests = async () => {
    setLoading(true);
    setError("");
    try {
      // Points to the new updated backend route
      const res = await API.get("/api/user/requests");
      setRequests(res.data.requests || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">My Access History</h2>
      {loading ? (
        <div className="animate-pulse text-gray-500">Loading requests...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : requests.length === 0 ? (
        <div className="text-gray-500">No access requests found.</div>
      ) : (
        <ul className="space-y-3">
          {requests.map(req => (
            <li key={req._id} className="p-4 border border-white/10 bg-white/5 rounded-lg flex items-center justify-between">
              <div>
                <div className="font-medium text-sm md:text-base">
                  {new Date(req.validFrom).toLocaleDateString()} → {new Date(req.validUntil).toLocaleDateString()}
                </div>
                <div className="text-xs mt-1 text-muted-foreground">
                  Status: 
                  <span className={`ml-1 font-bold ${
                    req.status === "APPROVED" ? "text-green-500" : 
                    req.status === "PENDING" ? "text-yellow-500" : 
                    "text-red-500"
                  }`}>
                    {req.status}
                  </span>
                </div>
                {req.status === "APPROVED" && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Current Location: <span className="text-blue-400 font-semibold">{req.currentState}</span>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MyQRRequests;