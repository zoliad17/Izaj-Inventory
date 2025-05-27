import { useState } from 'react';
import { supabase } from '../../Supabase/supabase';
import { useNavigate } from 'react-router-dom';

export default function OtpPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'enterPhone' | 'enterOtp'>('enterPhone');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function sendOtp() {
    setLoading(true);
    setMessage('');
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone });

      if (!error) {
        setStep('enterOtp');
        setMessage('OTP sent! Please check your SMS.');
      } else {
        setMessage(error.message || 'Failed to send OTP');
      }
    } catch {
      setMessage('Network error');
    }
    setLoading(false);
  }

  async function verifyOtp() {
    setLoading(true);
    setMessage('');
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: 'sms',
      });

      if (!error) {
        setMessage('OTP verified! Redirecting...');
        setTimeout(() => {
          navigate('/dashboard'); // Adjust path if needed
        }, 1000);
      } else {
        setMessage(error.message || 'Invalid OTP');
      }
    } catch {
      setMessage('Network error');
    }
    setLoading(false);
  }

  return (
    <div className="max-w-md mx-auto mt-24 p-8 bg-white rounded-xl shadow-lg font-sans">
      <h2 className="text-2xl font-semibold text-center text-green-600 mb-6">
        Two-Factor Authentication
      </h2>

      {step === 'enterPhone' && (
        <>
          <label htmlFor="phone" className="block mb-2 font-medium text-gray-700">
            Phone Number:
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1234567890"
            disabled={loading}
            className="w-full px-4 py-3 mb-6 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 transition"
            autoFocus
          />
          <button
            onClick={sendOtp}
            disabled={loading || !phone.trim()}
            className={`w-full py-3 rounded-lg text-white font-bold transition ${
              loading || !phone.trim()
                ? 'bg-green-300 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </>
      )}

      {step === 'enterOtp' && (
        <>
          <label htmlFor="otp" className="block mb-2 font-medium text-gray-700">
            Enter OTP:
          </label>
          <input
            id="otp"
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="123456"
            disabled={loading}
            className="w-full px-4 py-3 mb-6 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 transition"
            autoFocus
          />
          <div className="flex space-x-4">
            <button
              onClick={verifyOtp}
              disabled={loading || otp.length === 0}
              className={`flex-1 py-3 rounded-lg text-white font-bold transition ${
                loading || otp.length === 0
                  ? 'bg-green-300 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button
              onClick={() => setStep('enterPhone')}
              disabled={loading}
              className="flex-1 py-3 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition"
            >
              Back
            </button>
          </div>
        </>
      )}

      {message && (
        <p
          className={`mt-6 text-center font-semibold ${
            message.toLowerCase().includes('sent') || message.toLowerCase().includes('verified')
              ? 'text-green-600'
              : 'text-red-600'
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}

