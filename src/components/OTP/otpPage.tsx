import { useState } from 'react';

export default function OtpPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'enterPhone' | 'enterOtp'>('enterPhone');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function sendOtp() {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep('enterOtp');
        setMessage('OTP sent! Please check your SMS.');
      } else {
        setMessage(data.error || 'Failed to send OTP');
      }
    } catch (error) {
      setMessage('Network error');
    }
    setLoading(false);
  }

  async function verifyOtp() {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('OTP verified! Redirecting...');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      } else {
        setMessage(data.error || 'Invalid OTP');
      }
    } catch (error) {
      setMessage('Network error');
    }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 400, margin: 'auto', padding: 20}}>
      <h2>Two-Factor Authentication</h2>

      {step === 'enterPhone' && (
       <>
  <label>Phone Number:</label>
  <input
    type="tel"
    value={phone}
    onChange={(e) => setPhone(e.target.value)}
    placeholder="+1234567890"
    style={{ 
        width: '100%', 
        padding: 8, 
        marginBottom: 12,
        border: '2px solid #000000',
        marginTop: 10,
    }}
  />
  <button
    onClick={sendOtp}
    disabled={loading || !phone}
    style={{
      backgroundColor: 'green',
      color: 'white',
      padding: '8px 16px',
      border: 'none',
      borderRadius: 4,
      cursor: loading || !phone ? 'not-allowed' : 'pointer',
    }}
  >
    {loading ? 'Sending...' : 'Send OTP'}
  </button>
</>

      )}

      {step === 'enterOtp' && (
        <>
          <label>Enter OTP:</label>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="123456"
            style={{ width: '100%', padding: 8, marginBottom: 12 }}
          />
          <button onClick={verifyOtp} disabled={loading || otp.length === 0}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
          <button
            style={{ marginLeft: 10 }}
            onClick={() => setStep('enterPhone')}
            disabled={loading}
          >
            Back
          </button>
        </>
      )}

      {message && <p style={{ marginTop: 12 }}>{message}</p>}
    </div>
  );
}
