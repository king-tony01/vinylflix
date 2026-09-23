import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { apiRequest } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import { VinylflixLogo } from '../components/VinylflixLogo.js';
import { Mail, CheckCircle2, AlertCircle, RefreshCw, ArrowRight, ShieldCheck } from 'lucide-react';

export const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, refreshUser } = useAuth();

  const [email, setEmail] = useState<string>('');
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState<boolean>(false);
  const [resending, setResending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    // Handle single digit
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto advance focus
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit when all 6 digits entered
    if (newOtp.every((digit) => digit !== '') && value) {
      submitVerification(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
      inputRefs.current[5]?.focus();
      submitVerification(pastedData);
    }
  };

  const submitVerification = async (codeToSubmit?: string) => {
    const fullCode = codeToSubmit || otp.join('');
    if (fullCode.length !== 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }
    if (!email) {
      setError('Please provide your email address.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const res = await apiRequest('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        code: fullCode,
      }),
    });

    if (res.success && res.data) {
      setSuccessMsg(res.data.message || 'Email verified successfully!');
      if (res.data.tokens && res.data.user) {
        login(res.data.tokens.accessToken, res.data.user);
      } else {
        await refreshUser();
      }
      setTimeout(() => {
        navigate('/memberships');
      }, 1200);
    } else {
      setError(res.error?.message || 'Invalid verification code. Please check and try again.');
    }
    setLoading(false);
  };

  const handleResend = async () => {
    if (!email) {
      setError('Please enter your email address to resend code.');
      return;
    }
    if (cooldown > 0) return;

    setResending(true);
    setError(null);
    setSuccessMsg(null);

    const res = await apiRequest('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });

    if (res.success) {
      setSuccessMsg(res.data?.message || 'A new 6-digit verification code has been sent to your email.');
      setCooldown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } else {
      setError(res.error?.message || 'Failed to resend code. Please try again later.');
    }
    setResending(false);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-800/80 p-8 shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto flex items-center justify-center">
            <VinylflixLogo className="w-12 h-12 drop-shadow-[0_0_16px_rgba(255,0,145,0.45)]" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Verify Your Email</h2>
          <p className="text-xs text-slate-400">
            Enter the 6-digit verification code sent to your email
          </p>
        </div>

        {/* Email Address Indicator */}
        <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800/80 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 flex-shrink-0">
            <Mail className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Verification target
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-transparent text-xs font-bold text-white focus:outline-none placeholder:text-slate-600 truncate"
            />
          </div>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 6-Digit OTP Boxes */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-300 text-center">
            6-Digit Security Code
          </label>
          <div className="flex justify-center gap-2 sm:gap-2.5">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                autoFocus={index === 0}
                className="w-11 h-13 sm:w-12 sm:h-14 bg-slate-950 border border-slate-800 rounded-2xl text-center text-xl font-black text-white focus:outline-none focus:border-[#FF0091] focus:ring-2 focus:ring-[#FF0091]/20 transition-all font-mono shadow-inner"
              />
            ))}
          </div>
        </div>

        {/* Verify Action Button */}
        <button
          type="button"
          onClick={() => submitVerification()}
          disabled={loading || otp.some((d) => !d)}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF0091] via-[#7928CA] to-[#360099] text-white font-bold text-sm shadow-lg shadow-[#FF0091]/25 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" /> Verifying...
            </span>
          ) : (
            <>
              <span>Verify & Continue</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Resend & Cooldown Controls */}
        <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-pink-400" />
            <span>Expires in 15 mins</span>
          </div>

          <button
            type="button"
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="text-pink-400 font-bold hover:underline disabled:text-slate-600 disabled:no-underline transition-colors flex items-center gap-1"
          >
            {resending ? (
              <span className="flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" /> Sending...
              </span>
            ) : cooldown > 0 ? (
              <span>Resend in {cooldown}s</span>
            ) : (
              <span>Resend Code</span>
            )}
          </button>
        </div>

        {/* Footer Navigation */}
        <div className="text-center pt-3 border-t border-slate-800/80">
          <p className="text-xs text-slate-400">
            Already verified or using a different email?{' '}
            <Link to="/login" className="text-pink-400 font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
