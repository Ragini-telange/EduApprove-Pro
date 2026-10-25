import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../../app/providers/AuthProvider';
import { UserRole, getRoleDashboardPath, getRoleDisplayName } from '../../../types/auth';
import {
  Building2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  User,
  KeyRound,
  Building,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';

export const LoginPage: React.FC = () => {
  const { login, signUp, loginAsDemo, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Mode: Sign In vs Create New User
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Sign In State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Sign Up State
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [signUpShowPassword, setSignUpShowPassword] = useState(false);
  const [signUpRole, setSignUpRole] = useState<UserRole>('institution');
  const [signUpInstName, setSignUpInstName] = useState('');
  const [signUpInstCode, setSignUpInstCode] = useState('');
  const [signUpRegOffice, setSignUpRegOffice] = useState('Western Regional Office (WRO - Pune)');
  const [signUpAuthKey, setSignUpAuthKey] = useState('');

  // UI & Feedback States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Forgot Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // If already authenticated, redirect according to verified statutory role
  if (isAuthenticated && role) {
    const searchParams = new URLSearchParams(location.search);
    const redirectParam = searchParams.get('redirect');
    const destination = redirectParam || getRoleDashboardPath(role);
    return <Navigate to={destination} replace />;
  }

  // Validate Sign In Fields
  const validateSignIn = (): boolean => {
    const errors: Record<string, string> = {};
    if (!identifier.trim()) {
      errors.identifier = 'Official email or username is required.';
    }
    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 4) {
      errors.password = 'Password must be at least 4 characters.';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate Sign Up Fields
  const validateSignUp = (): boolean => {
    const errors: Record<string, string> = {};
    if (!signUpName.trim()) {
      errors.signUpName = 'Full official name is required.';
    }
    if (!signUpEmail.trim()) {
      errors.signUpEmail = 'Email address is required.';
    } else if (!signUpEmail.includes('@') || !signUpEmail.includes('.')) {
      errors.signUpEmail = 'Please provide a valid email format (e.g. officer@institution.edu).';
    }
    if (!signUpPassword) {
      errors.signUpPassword = 'Password is required.';
    } else if (signUpPassword.length < 6) {
      errors.signUpPassword = 'Password must be at least 6 characters long.';
    }
    if (signUpPassword !== signUpConfirmPassword) {
      errors.signUpConfirmPassword = 'Passwords do not match.';
    }
    if (signUpRole === 'regional_officer' && !signUpAuthKey.trim()) {
      errors.signUpAuthKey = 'Official Clearance Key required for Regional Officer role (Demo: AICTE-RO-2026).';
    }
    if (signUpRole === 'senior_authority' && !signUpAuthKey.trim()) {
      errors.signUpAuthKey = 'Ministry Security Key required for Senior Authority role (Demo: AICTE-HQ-2026).';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Sign In Submit
  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!validateSignIn()) return;

    setIsLoading(true);
    try {
      const session = await login(identifier.trim(), password);
      const searchParams = new URLSearchParams(location.search);
      const redirectParam = searchParams.get('redirect');
      const targetDashboard = redirectParam || getRoleDashboardPath(session.user.role);
      navigate(targetDashboard, { replace: true });
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Authentication failed. Please verify your credentials and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Sign Up Submit
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!validateSignUp()) return;

    setIsLoading(true);
    try {
      const session = await signUp({
        name: signUpName.trim(),
        email: signUpEmail.trim(),
        password: signUpPassword,
        role: signUpRole,
        institutionName: signUpRole === 'institution' ? signUpInstName.trim() : undefined,
        institutionCode: signUpRole === 'institution' ? (signUpInstCode.trim() || 'AICTE-INS-10245') : undefined,
        regionalOffice: signUpRole === 'regional_officer' ? signUpRegOffice : undefined,
        authorizationKey: signUpRole !== 'institution' ? signUpAuthKey.trim() : undefined,
      });

      setSuccessMessage(
        `Account created successfully as ${getRoleDisplayName(session.user.role)}! Redirecting to your dashboard...`
      );

      const targetDashboard = getRoleDashboardPath(session.user.role);
      setTimeout(() => {
        navigate(targetDashboard, { replace: true });
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please check your details.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fast Demo Persona Login
  const handleDemoLogin = async (demoRole: UserRole) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const session = await loginAsDemo(demoRole);
      const targetDashboard = getRoleDashboardPath(session.user.role);
      navigate(targetDashboard, { replace: true });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to switch demo persona.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* SIH Demonstration Prototype Disclaimer Ribbon */}
      <div className="bg-slate-900 text-amber-300 text-[10px] sm:text-[11px] font-medium px-4 py-1.5 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2 mx-auto text-center">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
          <span>
            <strong>SIH Prototype Demonstration:</strong> Realistic simulated regulatory dataset &bull; Sandbox Mode &bull; Not connected to live production AICTE systems.
          </span>
        </div>
      </div>

      {/* Top Government Portal Header Band */}
      <header className="border-b border-slate-200 bg-white shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-aicte-navy to-aicte-blue text-white flex items-center justify-center shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-extrabold tracking-wide text-slate-900 uppercase block leading-tight">
                AICTE SmartAssist
              </span>
              <span className="text-xs text-aicte-primary font-semibold">
                National Regulatory Approval & Compliance Platform
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              SIH Sandbox
            </span>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 font-medium ml-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Unified Portal</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Form Container Section */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-lg">
          {/* Card Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            {/* Card Header with Tab Switcher */}
            <div className="bg-gradient-to-r from-aicte-navy via-slate-900 to-aicte-blue text-white p-6 sm:p-7 text-center relative">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600/90 text-white shadow-md mb-3">
                <Lock className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">AICTE Statutory Portal</h1>
              <p className="text-xs text-slate-300 mt-1">
                Unified regulatory authentication for Institutions, Regional Desks, and Central Bureau
              </p>

              {/* Mode Toggle Tabs */}
              <div className="mt-5 flex rounded-xl bg-slate-800/80 p-1 border border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setValidationErrors({});
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    authMode === 'signin'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setValidationErrors({});
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    authMode === 'signup'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Create New User</span>
                </button>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-6 sm:p-8">
              {/* Feedback Alerts */}
              {errorMessage && (
                <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                  <span className="leading-relaxed">{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span className="leading-relaxed font-semibold">{successMessage}</span>
                </div>
              )}

              {/* MODE 1: SIGN IN FORM */}
              {authMode === 'signin' && (
                <form onSubmit={handleCredentialSubmit} className="space-y-4">
                  {/* Email / Identifier */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Email Address or Officer ID
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => {
                          setIdentifier(e.target.value);
                          if (validationErrors.identifier) {
                            setValidationErrors((prev) => ({ ...prev, identifier: undefined }));
                          }
                        }}
                        placeholder="e.g. principal@pict.edu, ragini.telange@aicte-india.org"
                        className={`w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                          validationErrors.identifier
                            ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/30'
                            : 'border-slate-300 focus:ring-blue-600'
                        }`}
                        disabled={isLoading}
                      />
                    </div>
                    {validationErrors.identifier && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">{validationErrors.identifier}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsForgotModalOpen(true)}
                        className="text-xs text-blue-700 hover:text-blue-900 font-semibold transition-colors"
                        tabIndex={-1}
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </span>
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
                        className={`w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                          validationErrors.password
                            ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/30'
                            : 'border-slate-300 focus:ring-blue-600'
                        }`}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {validationErrors.password && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">{validationErrors.password}</p>
                    )}
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-xs text-slate-600">Persist session across reloads</span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      isLoading={isLoading}
                      className="w-full py-2.5 font-bold text-xs tracking-wide shadow-sm"
                      rightIcon={!isLoading ? <ArrowRight className="w-4 h-4" /> : undefined}
                    >
                      {isLoading ? 'Verifying Credentials...' : 'Sign In'}
                    </Button>
                  </div>

                  {/* Switch to Sign Up Banner */}
                  <div className="text-center pt-3">
                    <span className="text-xs text-slate-500">
                      Need a new account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('signup');
                          setErrorMessage(null);
                          setValidationErrors({});
                        }}
                        className="text-blue-700 hover:text-blue-900 font-bold underline cursor-pointer"
                      >
                        Create New User
                      </button>
                    </span>
                  </div>
                </form>
              )}

              {/* MODE 2: CREATE NEW USER (SIGN UP) FORM */}
              {authMode === 'signup' && (
                <form onSubmit={handleSignUpSubmit} className="space-y-4">
                  {/* Role Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Select Regulatory Role
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSignUpRole('institution');
                          setValidationErrors((prev) => ({ ...prev, signUpAuthKey: undefined }));
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          signUpRole === 'institution'
                            ? 'border-blue-600 bg-blue-50/80 text-blue-950 font-bold shadow-2xs'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Building className="w-4 h-4 text-blue-600 mb-1" />
                        <span className="block text-[11px] font-bold">Institution</span>
                        <span className="text-[10px] text-slate-500 font-normal">Principal/Admin</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSignUpRole('regional_officer')}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          signUpRole === 'regional_officer'
                            ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 font-bold shadow-2xs'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-600 mb-1" />
                        <span className="block text-[11px] font-bold">Regional Desk</span>
                        <span className="text-[10px] text-slate-500 font-normal">Scrutiny Officer</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSignUpRole('senior_authority')}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          signUpRole === 'senior_authority'
                            ? 'border-purple-600 bg-purple-50/80 text-purple-950 font-bold shadow-2xs'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <ShieldAlert className="w-4 h-4 text-purple-600 mb-1" />
                        <span className="block text-[11px] font-bold">HQ Bureau</span>
                        <span className="text-[10px] text-slate-500 font-normal">Senior Advisor</span>
                      </button>
                    </div>
                  </div>

                  {/* Privileged Role Warning & Clearance Code Input */}
                  {signUpRole !== 'institution' && (
                    <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl space-y-2">
                      <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                        <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                        <span>Privileged Role Authorization Required</span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        To maintain statutory separation of powers, officer roles require an official clearance access key.
                      </p>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-bold uppercase text-amber-900">
                            Clearance Key
                          </label>
                          <span className="text-[10px] text-amber-700 font-medium">
                            Demo key:{' '}
                            <code className="px-1 py-0.5 bg-amber-100 rounded text-amber-900 font-mono font-bold">
                              {signUpRole === 'regional_officer' ? 'AICTE-RO-2026' : 'AICTE-HQ-2026'}
                            </code>
                          </span>
                        </div>
                        <input
                          type="text"
                          value={signUpAuthKey}
                          onChange={(e) => {
                            setSignUpAuthKey(e.target.value);
                            if (validationErrors.signUpAuthKey) {
                              setValidationErrors((prev) => ({ ...prev, signUpAuthKey: undefined }));
                            }
                          }}
                          placeholder={signUpRole === 'regional_officer' ? 'AICTE-RO-2026' : 'AICTE-HQ-2026'}
                          className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 ${
                            validationErrors.signUpAuthKey
                              ? 'border-rose-300 focus:ring-rose-500'
                              : 'border-amber-300 focus:ring-amber-500'
                          }`}
                          disabled={isLoading}
                        />
                        {validationErrors.signUpAuthKey && (
                          <p className="text-[11px] text-rose-600 mt-1 font-medium">
                            {validationErrors.signUpAuthKey}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        value={signUpName}
                        onChange={(e) => {
                          setSignUpName(e.target.value);
                          if (validationErrors.signUpName) {
                            setValidationErrors((prev) => ({ ...prev, signUpName: undefined }));
                          }
                        }}
                        placeholder="e.g. Dr. Ramesh Gupta"
                        className={`w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                          validationErrors.signUpName
                            ? 'border-rose-300 focus:ring-rose-500'
                            : 'border-slate-300 focus:ring-blue-600'
                        }`}
                        disabled={isLoading}
                      />
                    </div>
                    {validationErrors.signUpName && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">{validationErrors.signUpName}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Official Email Address
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input
                        type="email"
                        value={signUpEmail}
                        onChange={(e) => {
                          setSignUpEmail(e.target.value);
                          if (validationErrors.signUpEmail) {
                            setValidationErrors((prev) => ({ ...prev, signUpEmail: undefined }));
                          }
                        }}
                        placeholder="e.g. principal@institution.edu or officer@aicte-india.org"
                        className={`w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                          validationErrors.signUpEmail
                            ? 'border-rose-300 focus:ring-rose-500'
                            : 'border-slate-300 focus:ring-blue-600'
                        }`}
                        disabled={isLoading}
                      />
                    </div>
                    {validationErrors.signUpEmail && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">{validationErrors.signUpEmail}</p>
                    )}
                  </div>

                  {/* Role-Specific Fields */}
                  {signUpRole === 'institution' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Institution Name
                        </label>
                        <input
                          type="text"
                          value={signUpInstName}
                          onChange={(e) => setSignUpInstName(e.target.value)}
                          placeholder="e.g. Pune Inst. of Tech"
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                          disabled={isLoading}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Permanent ID
                        </label>
                        <input
                          type="text"
                          value={signUpInstCode}
                          onChange={(e) => setSignUpInstCode(e.target.value)}
                          placeholder="e.g. 1-4293811"
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  )}

                  {signUpRole === 'regional_officer' && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Assigned Regional Jurisdiction
                      </label>
                      <select
                        value={signUpRegOffice}
                        onChange={(e) => setSignUpRegOffice(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        disabled={isLoading}
                      >
                        <option value="Western Regional Office (WRO - Pune)">Western Regional Office (WRO - Pune & Mumbai)</option>
                        <option value="Northern Regional Office (NRO - Kanpur)">Northern Regional Office (NRO - Kanpur)</option>
                        <option value="Southern Regional Office (SRO - Chennai)">Southern Regional Office (SRO - Chennai)</option>
                        <option value="Central Regional Office (CRO - Bhopal)">Central Regional Office (CRO - Bhopal)</option>
                        <option value="South-Western Regional Office (SWRO - Bengaluru)">South-Western Regional Office (SWRO - Bengaluru)</option>
                        <option value="Eastern Regional Office (ERO - Kolkata)">Eastern Regional Office (ERO - Kolkata)</option>
                      </select>
                    </div>
                  )}

                  {/* Password & Confirm Password */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Password (min 6 chars)
                      </label>
                      <div className="relative">
                        <input
                          type={signUpShowPassword ? 'text' : 'password'}
                          value={signUpPassword}
                          onChange={(e) => {
                            setSignUpPassword(e.target.value);
                            if (validationErrors.signUpPassword) {
                              setValidationErrors((prev) => ({ ...prev, signUpPassword: undefined }));
                            }
                          }}
                          placeholder="Password"
                          className={`w-full pl-3 pr-8 py-2 text-xs bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 ${
                            validationErrors.signUpPassword
                              ? 'border-rose-300 focus:ring-rose-500'
                              : 'border-slate-300 focus:ring-blue-600'
                          }`}
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setSignUpShowPassword(!signUpShowPassword)}
                          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                          tabIndex={-1}
                        >
                          {signUpShowPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      {validationErrors.signUpPassword && (
                        <p className="text-[10px] text-rose-600 mt-1 font-medium">{validationErrors.signUpPassword}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Confirm Password
                      </label>
                      <input
                        type={signUpShowPassword ? 'text' : 'password'}
                        value={signUpConfirmPassword}
                        onChange={(e) => {
                          setSignUpConfirmPassword(e.target.value);
                          if (validationErrors.signUpConfirmPassword) {
                            setValidationErrors((prev) => ({ ...prev, signUpConfirmPassword: undefined }));
                          }
                        }}
                        placeholder="Re-enter password"
                        className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 ${
                          validationErrors.signUpConfirmPassword
                            ? 'border-rose-300 focus:ring-rose-500'
                            : 'border-slate-300 focus:ring-blue-600'
                        }`}
                        disabled={isLoading}
                      />
                      {validationErrors.signUpConfirmPassword && (
                        <p className="text-[10px] text-rose-600 mt-1 font-medium">
                          {validationErrors.signUpConfirmPassword}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      isLoading={isLoading}
                      className="w-full py-2.5 font-bold text-xs tracking-wide shadow-sm"
                      rightIcon={!isLoading ? <ArrowRight className="w-4 h-4" /> : undefined}
                    >
                      {isLoading ? 'Creating Account & Registering Profile...' : 'Create Account & Sign In'}
                    </Button>
                  </div>

                  {/* Back to Sign In Link */}
                  <div className="text-center pt-2">
                    <span className="text-xs text-slate-500">
                      Already registered?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('signin');
                          setErrorMessage(null);
                          setValidationErrors({});
                        }}
                        className="text-blue-700 hover:text-blue-900 font-bold underline cursor-pointer"
                      >
                        Sign In here
                      </button>
                    </span>
                  </div>
                </form>
              )}

              {/* Fast Evaluator Persona Switcher */}
              <div className="mt-6 pt-5 border-t border-slate-200">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider mb-2.5">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>SIH Demo Personas (1-Click Login)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal">Pwd: demo123</span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800 text-xs">1. Institution Admin</span>
                        <span className="text-[11px] text-slate-500 block">Sakshi Sharma &bull; principal@pict.edu</span>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('signin');
                            setIdentifier('principal@pict.edu');
                            setPassword('demo123');
                          }}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 cursor-pointer"
                          title="Fill form fields"
                        >
                          Fill
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDemoLogin('institution')}
                          className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs cursor-pointer"
                        >
                          Login &rarr;
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800 text-xs">2. Regional Officer</span>
                        <span className="text-[11px] text-slate-500 block">Ragini Telange &bull; ragini.telange@aicte-india.org</span>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('signin');
                            setIdentifier('ragini.telange@aicte-india.org');
                            setPassword('demo123');
                          }}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 cursor-pointer"
                          title="Fill form fields"
                        >
                          Fill
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDemoLogin('regional_officer')}
                          className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs cursor-pointer"
                        >
                          Login &rarr;
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-purple-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800 text-xs">3. Senior Authority</span>
                        <span className="text-[11px] text-slate-500 block">Dr. Janhavi Hinganghatkar &bull; j.hinganghatkar@aicte-india.org</span>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('signin');
                            setIdentifier('j.hinganghatkar@aicte-india.org');
                            setPassword('demo123');
                          }}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 cursor-pointer"
                          title="Fill form fields"
                        >
                          Fill
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDemoLogin('senior_authority')}
                          className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-2xs cursor-pointer"
                        >
                          Login &rarr;
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center mt-6 text-xs text-slate-400 space-y-1">
            <p>AICTE SmartAssist &bull; Enterprise Regulatory Automation</p>
            <p className="text-[11px]">Strict Role-Based Access Enforced at Database &amp; Route Layers</p>
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
        title="Reset Official Password"
        subtitle="AICTE SmartAssist Security Service"
      >
        {forgotSent ? (
          <div className="text-center py-4 space-y-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Recovery Instructions Dispatched</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              If an authorized account exists for <strong>{forgotEmail}</strong>, an AICTE
              official verification link has been sent to the registered mailbox.
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
            className="space-y-4"
          >
            <p className="text-xs text-slate-600 leading-relaxed">
              Enter your registered institutional or officer email address. A password recovery verification token
              will be dispatched to your official inbox.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Registered Email
              </label>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="e.g. principal@gcepune.ac.in"
                required
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsForgotModalOpen(false);
                  setForgotSent(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Send Recovery Link
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
