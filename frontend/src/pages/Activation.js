import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../components/ui/input-otp';
import { Mail, Key, CheckCircle, Loader2, Shield, AlertCircle } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Generate a unique device ID based on browser fingerprint
const generateDeviceId = () => {
  const stored = localStorage.getItem('device_id');
  if (stored) return stored;
  
  // Create a fingerprint from available browser data
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('TechZone', 2, 2);
  const canvasData = canvas.toDataURL();
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    canvasData.slice(-50)
  ].join('|');
  
  // Create a hash from the fingerprint
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const deviceId = 'DEV-' + Math.abs(hash).toString(36).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
  localStorage.setItem('device_id', deviceId);
  return deviceId;
};

export default function Activation({ onActivated }) {
  const [step, setStep] = useState('email'); // 'email', 'code', 'success'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deviceId] = useState(generateDeviceId());
  const [businessInfo, setBusinessInfo] = useState({
    business_name: 'TechZone POS',
    business_logo: null
  });

  useEffect(() => {
    // Fetch business info for branding
    const fetchBusinessInfo = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/settings/public`);
        setBusinessInfo(response.data);
      } catch (err) {
        console.log('Could not fetch business info');
      }
    };
    fetchBusinessInfo();
  }, []);

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/activation/request-code`, {
        email: email
      });
      
      if (response.data.success) {
        setStep('code');
        // If code is returned (email service unavailable), show it
        if (response.data.code) {
          setError(`Email unavailable. Use code: ${response.data.code}`);
        }
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send activation code');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    if (code.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/activation/activate`, {
        code: code,
        device_id: deviceId
      });
      
      if (response.data.success) {
        setStep('success');
        // Wait a moment to show success, then proceed
        setTimeout(() => {
          localStorage.setItem('device_activated', 'true');
          localStorage.setItem('activation_email', response.data.activated_email);
          onActivated();
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          {businessInfo.business_logo ? (
            <img 
              src={businessInfo.business_logo.startsWith('/api') ? `${API_URL}${businessInfo.business_logo}` : businessInfo.business_logo} 
              alt="Logo" 
              className="h-16 mx-auto mb-4"
            />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
          )}
          <h1 className="text-2xl font-bold text-white">{businessInfo.business_name}</h1>
          <p className="text-purple-200 mt-1">Device Activation Required</p>
        </div>

        <Card className="border-0 shadow-2xl bg-white/10 backdrop-blur-lg">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-white text-xl">
              {step === 'email' && 'Activate Your Device'}
              {step === 'code' && 'Enter Activation Code'}
              {step === 'success' && 'Activation Successful!'}
            </CardTitle>
            <CardDescription className="text-purple-200">
              {step === 'email' && 'Enter your registered email to receive an activation code'}
              {step === 'code' && 'Check your email for the 6-digit code'}
              {step === 'success' && 'Your device is now activated'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-4">
            {step === 'email' && (
              <form onSubmit={handleRequestCode} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-purple-200">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="pl-10 bg-white/10 border-purple-500/30 text-white placeholder:text-purple-300/50 focus:border-purple-400"
                      required
                      data-testid="activation-email-input"
                    />
                  </div>
                </div>

                <div className="bg-purple-500/20 rounded-lg p-3 text-sm text-purple-200">
                  <p className="font-medium mb-1">Device ID:</p>
                  <code className="text-xs bg-black/20 px-2 py-1 rounded block overflow-x-auto">
                    {deviceId}
                  </code>
                </div>

                {error && (
                  <div className="bg-red-500/20 text-red-200 p-3 rounded-lg text-sm flex items-start gap-2" data-testid="activation-error">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                  disabled={loading}
                  data-testid="request-code-btn"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending Code...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Activation Code
                    </>
                  )}
                </Button>
              </form>
            )}

            {step === 'code' && (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <InputOTP 
                    maxLength={6} 
                    value={code} 
                    onChange={setCode}
                    data-testid="activation-code-input"
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="bg-white/10 border-purple-500/30 text-white text-lg" />
                      <InputOTPSlot index={1} className="bg-white/10 border-purple-500/30 text-white text-lg" />
                      <InputOTPSlot index={2} className="bg-white/10 border-purple-500/30 text-white text-lg" />
                      <InputOTPSlot index={3} className="bg-white/10 border-purple-500/30 text-white text-lg" />
                      <InputOTPSlot index={4} className="bg-white/10 border-purple-500/30 text-white text-lg" />
                      <InputOTPSlot index={5} className="bg-white/10 border-purple-500/30 text-white text-lg" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <p className="text-center text-purple-200 text-sm">
                  Code sent to: <span className="font-medium text-white">{email}</span>
                </p>

                {error && (
                  <div className="bg-red-500/20 text-red-200 p-3 rounded-lg text-sm flex items-start gap-2" data-testid="activation-error">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setStep('email');
                      setCode('');
                      setError('');
                    }}
                    className="flex-1 border-purple-500/30 text-purple-200 hover:bg-purple-500/20"
                    data-testid="back-btn"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleActivate}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                    disabled={loading || code.length !== 6}
                    data-testid="activate-btn"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Key className="w-4 h-4 mr-2" />
                        Activate
                      </>
                    )}
                  </Button>
                </div>

                <button 
                  onClick={handleRequestCode}
                  className="w-full text-purple-300 text-sm hover:text-white transition-colors"
                  disabled={loading}
                  data-testid="resend-code-btn"
                >
                  Didn't receive the code? Click to resend
                </button>
              </div>
            )}

            {step === 'success' && (
              <div className="text-center py-4">
                <div className="w-20 h-20 bg-green-500/20 rounded-full mx-auto flex items-center justify-center mb-4">
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </div>
                <p className="text-green-300 text-lg font-medium">Device Activated!</p>
                <p className="text-purple-200 text-sm mt-2">Redirecting to application...</p>
                <Loader2 className="w-5 h-5 text-purple-400 animate-spin mx-auto mt-4" />
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-purple-300/60 text-xs mt-6">
          Each activation code is valid for 12 hours and can only be used on one device.
        </p>
      </div>
    </div>
  );
}
