import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ identifier?: string; password?: string }>({});

  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // If already authenticated, redirect immediately to dashboard
  if (isAuthenticated) {
    return <Navigate to="/institution/dashboard" replace />;
  }

  const validate = (): boolean => {
    const errors: { identifier?: string; password?: string } = {};
    if (!identifier.trim()) {
      errors.identifier = 'Institution ID or registered email is required.';
    }
    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validate()) return;

    setIsLoading(true);
    try {
      await login({
        identifier: identifier.trim(),
        password,
        rememberMe,
      });

      // Redirect to return URL or dashboard
      const from = (location.state as any)?.from?.pathname || '/institution/dashboard';
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Authentication failed. Please verify your Institution ID and Password.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Government Portal Header Band */}
      <header className="border-b border-slate-200 bg-white shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-700 text-white flex items-center justify-center shadow-sm">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-sm font-extrabold tracking-wide text-slate-900 uppercase block leading-tight">
                AICTE SmartAssist
              </span>
              <span className="text-xs text-indigo-700 font-semibold">
                All India Council for Technical Education
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Official Institutional Access Portal</span>
          </div>
        </div>
      </header>

      {/* Main Login Card Section */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          {/* Card Container */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden">
            {/* Card Header */}
            <div className="bg-slate-900 text-white p-6 sm:p-7 text-center relative">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white shadow-md mb-3">
                <Lock className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">Institution Portal Login</h1>
              <p className="text-xs text-slate-400 mt-1">
                Secure access for AICTE approved institutions &amp; colleges
              </p>
            </div>

            {/* Form Content */}
            <div className="p-6 sm:p-8">
              {/* Invalid credentials error alert */}
              {errorMessage && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Authentication Failed</span>
                    <span>{errorMessage}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4.5" noValidate>
                {/* Institution ID or Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Institution ID / Official Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        if (validationErrors.identifier) {
                          setValidationErrors((prev) => ({ ...prev, identifier: undefined }));
                        }
                      }}
                      placeholder="Enter your Institution ID or registered email"
                      className={`w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                        validationErrors.identifier
                          ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20'
                          : 'border-slate-300 focus:ring-indigo-600'
                      }`}
                      disabled={isLoading}
                    />
                  </div>
                  {validationErrors.identifier && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">
                      {validationErrors.identifier}
                    </p>
                  )}
                </div>

                {/* Password with Show/Hide toggle */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsForgotModalOpen(true)}
                      className="text-xs text-indigo-700 hover:text-indigo-900 font-semibold transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (validationErrors.password) {
                          setValidationErrors((prev) => ({ ...prev, password: undefined }));
                        }
                      }}
                      placeholder="Enter your password"
                      className={`w-full pl-10 pr-11 py-2.5 text-xs bg-slate-50 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                        validationErrors.password
                          ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20'
                          : 'border-slate-300 focus:ring-indigo-600'
                      }`}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded transition-colors"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {validationErrors.password && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">
                      {validationErrors.password}
                    </p>
                  )}
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="text-xs text-slate-600">Keep me signed in on this device</span>
                  </label>
                </div>

                {/* Submit Button with Loading State */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={isLoading}
                    className="w-full py-2.5 font-bold text-xs tracking-wide"
                    rightIcon={!isLoading ? <ArrowRight className="w-4 h-4" /> : undefined}
                  >
                    {isLoading ? 'Verifying Credentials...' : 'Sign In to Institution Portal'}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center mt-6 text-xs text-slate-400 space-y-1">
            <p>AICTE SmartAssist &bull; Enterprise Workflow Management</p>
            <p className="text-[11px]">Authorized institutional personnel only. Unauthorized access is prohibited.</p>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => {
          setIsForgotModalOpen(false);
          setForgotSent(false);
        }}
        title="Reset Institutional Password"
        subtitle="AICTE SmartAssist Security Service"
        maxWidth="sm"
      >
        {forgotSent ? (
          <div className="text-center py-4 space-y-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Recovery Instructions Dispatched</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              If an active institution record exists for <strong>{forgotEmail}</strong>, an AICTE
              official verification link has been sent to the registered Principal email address.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsForgotModalOpen(false);
                setForgotSent(false);
              }}
              className="mt-2"
            >
              Back to Login
            </Button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (forgotEmail.trim()) {
                setForgotSent(true);
              }
            }}
            className="space-y-4 text-xs"
          >
            <p className="text-slate-600 leading-relaxed">
              Enter your Institution ID or registered AICTE portal email address. We will dispatch a
              secure password reset authorization link to the Principal's liaison mailbox.
            </p>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Institution ID or Email Address
              </label>
              <input
                type="text"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="Enter your Institution ID or registered email"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Send Reset Link
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Government Footer */}
      <footer className="border-t border-slate-200 bg-white py-3">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          &copy; 2026 All India Council for Technical Education (AICTE). All Rights Reserved.
        </div>
      </footer>
    </div>
  );
};
