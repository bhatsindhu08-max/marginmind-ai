import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '../types';
import { apiRequest } from '../api/client';

interface AuthContextType {
  token: string | null;
  role: UserRole;
  fullName: string;
  businessName: string;
  industryType: string;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  switchDemoRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('marginmind_token'));
  const [role, setRole] = useState<UserRole>((localStorage.getItem('marginmind_role') as UserRole) || 'business_owner');
  const [fullName, setFullName] = useState<string>(localStorage.getItem('marginmind_name') || 'Rajeshwar Patil');
  const [businessName, setBusinessName] = useState<string>(localStorage.getItem('marginmind_biz') || 'Apex Precision Forging Ltd.');
  const [industryType, setIndustryType] = useState<string>('metal_steel');

  useEffect(() => {
    // If no token exists, log in by default with seed demo credentials for immediate rich experience
    if (!token) {
      login('owner@apexforge.com', 'password123').catch(() => {});
    }
  }, []);

  const login = async (email: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const data: any = await apiRequest('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });

    localStorage.setItem('marginmind_token', data.access_token);
    localStorage.setItem('marginmind_role', data.role);
    localStorage.setItem('marginmind_name', data.full_name);
    if (data.business_name) localStorage.setItem('marginmind_biz', data.business_name);

    setToken(data.access_token);
    setRole(data.role as UserRole);
    setFullName(data.full_name);
    if (data.business_name) setBusinessName(data.business_name);
    if (data.industry_type) setIndustryType(data.industry_type);
  };

  const register = async (regData: any) => {
    const data: any = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(regData),
    });

    localStorage.setItem('marginmind_token', data.access_token);
    localStorage.setItem('marginmind_role', data.role);
    localStorage.setItem('marginmind_name', data.full_name);
    if (data.business_name) localStorage.setItem('marginmind_biz', data.business_name);

    setToken(data.access_token);
    setRole(data.role as UserRole);
    setFullName(data.full_name);
    setBusinessName(data.business_name);
    setIndustryType(data.industry_type);
  };

  const logout = () => {
    localStorage.removeItem('marginmind_token');
    localStorage.removeItem('marginmind_role');
    localStorage.removeItem('marginmind_name');
    localStorage.removeItem('marginmind_biz');
    setToken(null);
  };

  const switchDemoRole = async (targetRole: UserRole) => {
    const roleEmailMap: Record<UserRole, string> = {
      business_owner: 'owner@apexforge.com',
      finance_manager: 'finance@apexforge.com',
      procurement_manager: 'procurement@apexforge.com',
      production_manager: 'production@apexforge.com',
    };
    await login(roleEmailMap[targetRole], 'password123');
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        role,
        fullName,
        businessName,
        industryType,
        isAuthenticated: !!token,
        login,
        register,
        logout,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
