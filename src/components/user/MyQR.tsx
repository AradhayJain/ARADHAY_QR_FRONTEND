import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import QRCode from 'qrcode';
import { Loader2, Play, CheckCircle, XCircle } from 'lucide-react';
import { Canvas } from 'react-qr-code';
import { toast } from 'sonner';
import API from '@/api/api';
import { useAuth } from '@/context/AuthContext';

const MyQR = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [qrData, setQrData] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [state, setState] = useState<'IN' | 'OUT' | ''>('');
  const [currentState, setCurrentState] = useState('OUTSIDE');
  const [machineId, setMachineId] = useState('machine1');
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [countdown, setCountdown] = useState(20);
  const [enteredSuccessfully, setEnteredSuccessfully] = useState<boolean | null>(null);
  const [idNumber, setIdNumber] = useState('');

  const validMachines = ['machine1', 'machine2', 'gateA', 'gateB'];

  useEffect(() => {
    if (user) {
      // Assume idNumber from profile - in real app fetch from /api/user/profile/:idNumber
      setIdNumber(user.idNumber || '23/SE/001'); // Mock - replace with real
    }
  }, [user]);

  const generateQR = async () => {
    if (!idNumber) {
      toast.error('ID Number required');
      return;
    }
    setLoading(true);
    try {
      const res = await API.post('/api/user/allocate-qr', { idNumber, machineId });
      setQrData(res.data.qrData);
      setTokenId(res.data.tokenId);
      setState(res.data.state);
      setCurrentState(res.data.currentState);
      toast.success(`QR generated for ${machineId} (${res.data.state})`);
      // Start 20s timer for popup
      setTimeout(() => setShowConfirmPopup(true), 20000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate QR');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showConfirmPopup && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && showConfirmPopup) {
      // Auto no if no response
      handleConfirm(false);
    }
  }, [countdown, showConfirmPopup]);

  const handleConfirm = async (success: boolean) => {
    setEnteredSuccessfully(success);
    setShowConfirmPopup(false);
    setCountdown(20);
    try {
      const res = await API.post('/api/user/confirm-entry', {
        tokenId,
        idNumber,
        enteredSuccessfully: success,
        machineId,
      });
      setCurrentState(res.data.currentState);
      setQrData(res.data.nextQRData || '');
      toast.success(res.data.message);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Confirm failed');
    }
  };

  if (!user) return <div>Please log in</div>;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>My QR - {machineId}</CardTitle>
        <CardDescription>Current state: <span className={`font-bold ${currentState === 'INSIDE' ? 'text-green-600' : 'text-orange-600'}`}>{currentState}</span></CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Select value={machineId} onValueChange={setMachineId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {validMachines.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={generateQR} disabled={loading || !idNumber}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Generate QR
          </Button>
        </div>
        {qrData && (
          <div className="flex flex-col items-center p-6 bg-gray-50 rounded-xl">
            <div className="text-sm text-muted-foreground mb-2">Scan: {state}</div>
            <QRCodeCanvas value={qrData} size={200} />
            <div className="text-xs mt-2">Token: {tokenId.slice(-8)}</div>
          </div>
        )}
      </CardContent>
      <Dialog open={showConfirmPopup} onOpenChange={setShowConfirmPopup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Did you enter successfully?</DialogTitle>
            <DialogDescription>
              {countdown > 0 ? `Auto-no in ${countdown}s` : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => handleConfirm(false)}>
              <XCircle className="w-4 h-4 mr-1" /> No
            </Button>
            <Button onClick={() => handleConfirm(true)}>
              <CheckCircle className="w-4 h-4 mr-1" /> Yes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default MyQR;
