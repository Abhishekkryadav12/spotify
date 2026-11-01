import React, { useState } from 'react';
import { X, Lock, Mail, User, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authModalMode,
    closeAuthModal,
    signIn,
    signUp,
    requestPasswordReset,
    resetPassword,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(authModalMode);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password states
  const [resetCode, setResetCode] = useState('');
  const [resetStep, setResetStep] = useState<'request' | 'verify'>('request');
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  // Loading & Error states
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Sync mode when modal opens
  React.useEffect(() => {
    setMode(authModalMode);
    setError(null);
    setResetMessage(null);
    setResetStep('request');
  }, [authModalMode, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else if (mode === 'signup') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match. Please verify your password.');
        }
        await signUp(fullName, email, password);
      } else if (mode === 'forgot') {
        if (resetStep === 'request') {
          const res = await requestPasswordReset(email);
          setResetMessage(res.message);
          setResetStep('verify');
        } else {
          await resetPassword(email, resetCode, password);
          setResetMessage('Password updated successfully! Please sign in with your new password.');
          setTimeout(() => {
            setMode('signin');
            setResetStep('request');
            setResetMessage(null);
            setPassword('');
          }, 1500);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-[#181818] border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl overflow-hidden select-none"
      >
        {/* Top Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1db954] via-emerald-400 to-[#1db954]" />

        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#1db954]/10 text-[#1db954] mb-3">
            {mode === 'forgot' ? (
              <KeyRound className="w-6 h-6" />
            ) : mode === 'signup' ? (
              <User className="w-6 h-6" />
            ) : (
              <Lock className="w-6 h-6" />
            )}
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            {mode === 'signin' && 'Welcome Back'}
            {mode === 'signup' && 'Create Your Account'}
            {mode === 'forgot' && (resetStep === 'request' ? 'Reset Password' : 'Enter Reset Code')}
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            {mode === 'signin' && 'Sign in to access your customized music soundscape'}
            {mode === 'signup' && 'Select your favorite languages and singers after signup'}
            {mode === 'forgot' &&
              (resetStep === 'request'
                ? "We'll send you a verification code to recover your account"
                : 'Enter the code and choose a new password')}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
            <span className="shrink-0 text-red-400">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {resetMessage && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{resetMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Diljit Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#242424] hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] text-white text-sm rounded-lg pl-10 pr-4 py-2.5 border border-neutral-700 focus:border-[#1db954] focus:outline-hidden transition-all placeholder:text-neutral-500"
                />
              </div>
            </div>
          )}

          {/* Email input (hidden during step 2 of forgot password if email already provided) */}
          {(mode !== 'forgot' || resetStep === 'request') && (
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#242424] hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] text-white text-sm rounded-lg pl-10 pr-4 py-2.5 border border-neutral-700 focus:border-[#1db954] focus:outline-hidden transition-all placeholder:text-neutral-500"
                />
              </div>
            </div>
          )}

          {/* Reset Code input in step 2 of forgot password */}
          {mode === 'forgot' && resetStep === 'verify' && (
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                6-Digit Verification Code
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="e.g. 123456"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  className="w-full bg-[#242424] font-mono text-center tracking-widest text-lg text-white rounded-lg pl-10 pr-4 py-2.5 border border-neutral-700 focus:border-[#1db954] focus:outline-hidden transition-all placeholder:text-neutral-500"
                />
              </div>
            </div>
          )}

          {/* Password input */}
          {(mode !== 'forgot' || resetStep === 'verify') && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-neutral-300">
                  {mode === 'forgot' ? 'New Password' : 'Password'}
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError(null);
                    }}
                    className="text-xs text-[#1db954] hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={mode === 'forgot' ? 'Enter new password' : '••••••••'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#242424] hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] text-white text-sm rounded-lg pl-10 pr-10 py-2.5 border border-neutral-700 focus:border-[#1db954] focus:outline-hidden transition-all placeholder:text-neutral-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Confirm Password input for Sign Up */}
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#242424] hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] text-white text-sm rounded-lg pl-10 pr-4 py-2.5 border border-neutral-700 focus:border-[#1db954] focus:outline-hidden transition-all placeholder:text-neutral-500"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full bg-[#1db954] hover:bg-[#1ed760] disabled:opacity-50 text-black font-extrabold text-sm shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Processing...</span>
              </>
            ) : mode === 'signin' ? (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : mode === 'signup' ? (
              <>
                <span>Create Account & Continue</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : resetStep === 'request' ? (
              <span>Send Verification Code</span>
            ) : (
              <span>Set New Password</span>
            )}
          </button>
        </form>

        {/* Footer Mode Switch */}
        <div className="mt-6 pt-4 border-t border-neutral-800 text-center text-xs text-neutral-400">
          {mode === 'signin' ? (
            <p>
              Don't have an account?{' '}
              <button
                onClick={() => {
                  setMode('signup');
                  setError(null);
                }}
                className="font-bold text-white hover:text-[#1db954] hover:underline"
              >
                Sign up free
              </button>
            </p>
          ) : mode === 'signup' ? (
            <p>
              Already have an account?{' '}
              <button
                onClick={() => {
                  setMode('signin');
                  setError(null);
                }}
                className="font-bold text-white hover:text-[#1db954] hover:underline"
              >
                Log in
              </button>
            </p>
          ) : (
            <p>
              Remembered your password?{' '}
              <button
                onClick={() => {
                  setMode('signin');
                  setError(null);
                  setResetStep('request');
                }}
                className="font-bold text-white hover:text-[#1db954] hover:underline"
              >
                Back to Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
