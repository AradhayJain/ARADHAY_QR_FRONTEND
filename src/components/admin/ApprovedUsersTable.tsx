import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "@/api/api";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Calendar, User, Building2, Fingerprint, Clock, Activity, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface User {
  _id: string;
  fullName: string;
  idNumber: string;
  organisation: string;
  validFrom: string;
  validUntil: string;
}

interface ScanLog {
  _id: string;
  passType: "IN" | "OUT";
  gateId: string;
  result: "ALLOW" | "DENY";
  reason: string | null;
  createdAt: string;
}

const ApprovedUsersTable = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailUser, setDetailUser] = useState<User | null>(null);
  const [detailLogs, setDetailLogs] = useState<ScanLog[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editValidFrom, setEditValidFrom] = useState("");
  const [editValidUntil, setEditValidUntil] = useState("");
  const [editComment, setEditComment] = useState("");
  const [rejectUserId, setRejectUserId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-IN", {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  };

  const getAccessStatus = (from: string, until: string) => {
    const now = new Date();
    const start = new Date(from);
    const end = new Date(until);
    if (now < start) return <Badge variant="outline" className="text-blue-500 border-blue-500 bg-blue-50">Upcoming</Badge>;
    if (now > end) return <Badge variant="destructive" className="bg-red-50 text-red-600 border-red-100">Expired</Badge>;
    return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">Active Now</Badge>;
  };

  const normalized = (value: string) => value.toLowerCase().trim();

  const filteredUsers = searchInput
    ? users.filter((u) => {
      const query = normalized(searchInput);
      return (
        normalized(u.fullName).includes(query) ||
        normalized(u.idNumber).includes(query) ||
        normalized(u.organisation).includes(query)
      );
    })
    : users;

  useEffect(() => { fetchApproved(); }, []);

  const fetchApproved = async () => {
    try {
      setLoading(true);
      const res = await API.get("/api/admin/approved");
      setUsers(res.data.users || []);
    } catch (err) {
      toast.error("Failed to load approved users");
    } finally {
      setLoading(false);
    }
  };

  const openDetails = async (user: User) => {
    setDetailOpen(true);
    setDetailUser(user);
    setDetailLogs([]);
    try {
      setDetailLoading(true);
      const res = await API.get(`/api/admin/scanlogs/${user._id}`);
      setDetailLogs(res.data?.logs || []);
      if (res.data?.user) {
        setDetailUser(res.data.user);
      }
    } catch (err) {
      toast.error("Failed to load scan logs");
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>;

  return (
    <div className="glass-card border-none shadow-lg overflow-hidden bg-white/80 backdrop-blur-md">
      <div className="p-6 border-b flex flex-col gap-4 bg-gradient-to-r from-slate-50 to-transparent sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Approved Access Control</h2>
          <p className="text-sm text-slate-500">Manage and monitor active QR authorizations</p>
        </div>
        <div className="flex w-full max-w-md items-center gap-2">
          <div className="flex w-full items-center gap-2">
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, ID, or organisation"
              className="bg-white"
            />
            <Button type="button" size="sm" className="shrink-0" aria-label="Search">
              <Search className="w-4 h-4 mr-1" /> Search
            </Button>
          </div>
          <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100 shrink-0">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
        </div>
      </div>

      <Table>
        <TableHeader className="bg-slate-50/50">
          <TableRow>
            <TableHead className="font-bold">User Identity</TableHead>
            <TableHead className="font-bold">Organisation</TableHead>
            <TableHead className="font-bold">Current Status</TableHead>
            <TableHead className="font-bold">Validity Window</TableHead>
            <TableHead className="text-right font-bold">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredUsers.map((u) => (
            <TableRow key={u._id} className="group hover:bg-slate-50/80 transition-all">
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs uppercase">
                    {u.fullName.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-700">{u.fullName}</span>
                    <span className="text-xs font-mono text-slate-400">{u.idNumber}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-slate-600 font-medium">{u.organisation}</TableCell>
              <TableCell>{getAccessStatus(u.validFrom, u.validUntil)}</TableCell>
              <TableCell className="text-[11px]">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-600"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {formatDateTime(u.validFrom)}</div>
                  <div className="flex items-center gap-1.5 text-rose-500"><div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> {formatDateTime(u.validUntil)}</div>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-white hover:bg-primary hover:text-white transition-all"
                    onClick={() => navigate(`/admin/dashboard/user-profile/${u._id}`)}
                  >
                    View Profile
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-slate-100 hover:bg-primary hover:text-white transition-all shadow-none"
                    onClick={() => openDetails(u)}
                  >
                    View Activity
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-blue-500 text-blue-600"
                    onClick={() => {
                      setEditUserId(u._id);
                      setEditValidFrom(u.validFrom);
                      setEditValidUntil(u.validUntil);
                      setEditComment("");
                    }}
                  >
                    Edit Validity
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setRejectUserId(u._id);
                      setRejectReason("");
                    }}
                  >
                    Reject
                  </Button>
                </div>
              </TableCell>
              {/* Edit Validity Dialog */}
              <Dialog open={!!editUserId} onOpenChange={() => setEditUserId(null)}>
                <DialogContent className="max-w-md bg-white border border-slate-200 shadow-xl rounded-2xl">
                  <DialogHeader className="border-b border-slate-100 pb-4 mb-2">
                    <DialogTitle className="text-xl font-bold text-slate-800">Edit Validity & Comment</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-slate-700">Valid From</label>
                      <Input
                        type="datetime-local"
                        className="bg-slate-50 border-slate-200 text-slate-800 focus:ring-primary/20"
                        value={editValidFrom?.slice(0, 16)}
                        onChange={e => setEditValidFrom(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-slate-700">Valid Until</label>
                      <Input
                        type="datetime-local"
                        className="bg-slate-50 border-slate-200 text-slate-800 focus:ring-primary/20"
                        value={editValidUntil?.slice(0, 16)}
                        onChange={e => setEditValidUntil(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-slate-700">Comment</label>
                      <Input
                        type="text"
                        className="bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:ring-primary/20"
                        value={editComment}
                        onChange={e => setEditComment(e.target.value)}
                        placeholder="Reason for change (user will see this)"
                      />
                    </div>
                    <div className="flex gap-2 justify-end mt-6 pt-2 border-t border-slate-100">
                      <Button variant="outline" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50" onClick={() => setEditUserId(null)}>Cancel</Button>
                      <Button
                        className="bg-primary hover:bg-primary/90 text-white shadow-sm"
                        disabled={actionLoading}
                        onClick={async () => {
                          setActionLoading(true);
                          try {
                            await API.patch(`/api/admin/update-validity/${editUserId}`, {
                              validFrom: editValidFrom,
                              validUntil: editValidUntil,
                              comment: editComment,
                            });
                            toast.success("Validity updated");
                            setEditUserId(null);
                            fetchApproved();
                          } catch (err: any) {
                            toast.error(err.response?.data?.message || "Failed to update validity");
                          } finally {
                            setActionLoading(false);
                          }
                        }}
                      >
                        {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Reject User Dialog */}
              <Dialog open={!!rejectUserId} onOpenChange={() => setRejectUserId(null)}>
                <DialogContent className="max-w-md bg-white/95 backdrop-blur-xl border border-rose-100 shadow-2xl rounded-2xl overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-400 to-rose-600" />
                  <DialogHeader className="border-b border-rose-50/50 pb-4 mb-2">
                    <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-3">
                      <span className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shadow-inner">
                        <span className="w-3 h-3 rounded-full bg-rose-500" />
                      </span>
                      Reject User Access
                    </DialogTitle>
                    <p className="text-slate-500 pt-2 text-sm leading-relaxed">
                      Please provide a clear reason for revoking access.
                    </p>
                  </DialogHeader>
                  <div className="space-y-5 py-2">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">
                        Rejection Reason <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        type="text"
                        className="bg-rose-50/30 border-rose-100 text-slate-800 placeholder:text-slate-400 focus-visible:border-rose-400 focus-visible:ring-rose-400/20 transition-all rounded-xl"
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        placeholder="E.g., Policy violation, expired contract..."
                      />
                      <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        This note will be securely recorded.
                      </p>
                    </div>
                    <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-slate-100/60 sm:space-x-2">
                      <Button variant="outline" className="bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors w-full sm:w-auto rounded-xl" onClick={() => setRejectUserId(null)}>Cancel</Button>
                      <Button
                        variant="destructive"
                        className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-md shadow-rose-200 transition-all w-full sm:w-auto rounded-xl"
                        disabled={actionLoading}
                        onClick={async () => {
                          setActionLoading(true);
                          try {
                            await API.post(`/api/admin/reject/${rejectUserId}`, {
                              rejectionReason: rejectReason,
                            });
                            toast.success("User rejected");
                            setRejectUserId(null);
                            fetchApproved();
                          } catch (err: any) {
                            toast.error(err.response?.data?.message || "Failed to reject user");
                          } finally {
                            setActionLoading(false);
                          }
                        }}
                      >
                        {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Confirm Rejection
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {filteredUsers.length === 0 && users.length > 0 && (
        <div className="p-8 text-center text-slate-500">No results found for "{searchInput}"</div>
      )}

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-slate-900 p-6 text-white">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary" /> Activity Dashboard
            </DialogTitle>
            <p className="text-slate-400 text-sm mt-1">Detailed scan telemetry for {detailUser?.fullName}</p>
          </div>

          <div className="p-6 space-y-6 bg-slate-50/50">
            {/* User Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Full Name', value: detailUser?.fullName, icon: User },
                { label: 'College ID', value: detailUser?.idNumber, icon: Fingerprint, mono: true },
                { label: 'Organisation', value: detailUser?.organisation, icon: Building2 },
                { label: 'Auth Window', value: 'Active Range', icon: Clock },
              ].map((item, i) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <item.icon className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                  </div>
                  <p className={`text-sm font-semibold text-slate-700 ${item.mono ? 'font-mono' : ''}`}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Scan Logs Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b bg-slate-50 flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-700">Verification History</h3>
                <Badge variant="outline" className="bg-white">{detailLogs.length} Records</Badge>
              </div>
              <div className="max-h-[350px] overflow-y-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50 sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="text-[11px] uppercase font-bold">Timestamp</TableHead>
                      <TableHead className="text-[11px] uppercase font-bold">Direction</TableHead>
                      <TableHead className="text-[11px] uppercase font-bold">Gate</TableHead>
                      <TableHead className="text-[11px] uppercase font-bold">Decision</TableHead>
                      <TableHead className="text-[11px] uppercase font-bold">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailLoading ? (
                      <TableRow><TableCell colSpan={5} className="h-32 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-300" /></TableCell></TableRow>
                    ) : detailLogs.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="h-32 text-center text-slate-400 text-sm italic">No recent activity recorded</TableCell></TableRow>
                    ) : (
                      detailLogs.map((log) => (
                        <TableRow key={log._id} className="hover:bg-slate-50 transition-colors">
                          <TableCell className="text-xs text-slate-500 font-medium">{formatDateTime(log.createdAt)}</TableCell>
                          <TableCell>
                            <Badge className={log.passType === "IN" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-orange-50 text-orange-600 border-orange-100"} variant="outline">
                              {log.passType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-bold text-slate-600 uppercase">{log.gateId}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <div className={`w-2 h-2 rounded-full ${log.result === "ALLOW" ? "bg-emerald-500" : "bg-rose-500"}`} />
                              <span className={`text-xs font-bold ${log.result === "ALLOW" ? "text-emerald-600" : "text-rose-600"}`}>{log.result}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-slate-400 italic max-w-[150px] truncate">{log.reason || "Success"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApprovedUsersTable;
