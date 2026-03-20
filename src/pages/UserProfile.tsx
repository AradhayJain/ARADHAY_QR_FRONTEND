import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Calendar, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import API from "@/api/api";

import ContributionCalendar from "@/components/ContributionCalendar";
import { useUserFullActivity } from "@/hooks/useUserFullActivity";

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
      const res = await API.get(`/api/admin/user-profile/${id}`);
      setProfile(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <p>Profile not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">{profile.user.fullName}</h1>
          <p className="text-muted-foreground">{profile.user.idNumber}</p>
        </div>

        {/* User Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Organisation</p>
                <p className="font-medium">{profile.user.organisation}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge
                  variant={
                    profile.user.status === "APPROVED"
                      ? "default"
                      : profile.user.status === "PENDING"
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {profile.user.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valid From</p>
                <p className="font-medium">{formatDate(profile.user.validFrom)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valid Until</p>
                <p className="font-medium">{formatDate(profile.user.validUntil)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current State</p>
                <Badge variant={profile.user.currentState === "INSIDE" ? "default" : "outline"}>
                  {profile.user.currentState}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{profile.statistics.totalDays}</p>
                  <p className="text-xs text-muted-foreground">Active Days</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">
                    {Math.floor(profile.statistics.totalDuration / 60)}h
                  </p>
                  <p className="text-xs text-muted-foreground">Total Hours</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{profile.statistics.averageDuration}m</p>
                  <p className="text-xs text-muted-foreground">Avg Duration</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <div>
                  <p className="text-2xl font-bold">{profile.statistics.flaggedDays}</p>
                  <p className="text-xs text-muted-foreground">Flagged Days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Calendar (Admin View) */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Activity Calendar (90 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminUserActivity userId={profile.user._id} />
          </CardContent>
        </Card>



        {/* Recent Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Scan Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {profile.recentLogs.map((log: any) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <Badge variant={log.passType === "IN" ? "default" : "secondary"}>
                      {log.passType}
                    </Badge>
                    <span className="ml-2 text-sm">{formatDate(log.createdAt)}</span>
                  </div>
                  <Badge variant={log.result === "ALLOW" ? "default" : "destructive"}>
                    {log.result}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};


// Component to fetch and render ContributionCalendar for admin view
function AdminUserActivity({ userId }: { userId: string }) {
  const { data, isLoading, error } = useUserFullActivity(userId);
  if (isLoading) return <div className="text-muted-foreground">Loading activity...</div>;
  if (error) return <div className="text-destructive">Error: {error}</div>;
  return <ContributionCalendar activities={data} />;
}

export default UserProfile;
