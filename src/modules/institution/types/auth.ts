export interface Institution {
  id: string;
  institutionCode: string;
  name: string;
  email: string;
  category?: string;
  institutionType?: string;
}

export interface AuthenticatedUser {
  id: string;
  institutionCode: string;
  name: string;
  email: string;
  role: 'institution_admin' | 'principal' | 'liaison_officer';
  token: string;
  loginTime: string;
}

export interface AuthResponse {
  user: AuthenticatedUser;
  token: string;
}

export interface LoginCredentials {
  identifier: string; // Institution ID or Email
  password: string;
  rememberMe?: boolean;
}
