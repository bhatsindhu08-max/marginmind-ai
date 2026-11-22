import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '../types';
import { apiRequest } from '../api/client';

interface AuthContextType {
  token: string | null;
  role: UserRole;
  fullName: string;
  businessName: string;
  industryType: string;
  businessId: number | null;
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
  const [industryType, setIndustryType] = useState<string>(localStorage.getItem('marginmind_industry') || 'metal_steel');
  const [businessId, setBusinessId] = useState<number | null>(
    localStorage.getItem('marginmind_biz_id') ? Number(localStorage.getItem('marginmind_biz_id')) : 1
  );

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
    if (data.industry_type) localStorage.setItem('marginmind_industry', data.industry_type);
    if (data.business_id) localStorage.setItem('marginmind_biz_id', String(data.business_id));

    setToken(data.access_token);
    setRole(data.role as UserRole);
    setFullName(data.full_name);
    if (data.business_name) setBusinessName(data.business_name);
    if (data.industry_type) setIndustryType(data.industry_type);
    if (data.business_id) setBusinessId(data.business_id);
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
    if (data.industry_type) localStorage.setItem('marginmind_industry', data.industry_type);
    if (data.business_id) localStorage.setItem('marginmind_biz_id', String(data.business_id));

    setToken(data.access_token);
    setRole(data.role as UserRole);
    setFullName(data.full_name);
    setBusinessName(data.business_name);
    setIndustryType(data.industry_type);
    if (data.business_id) setBusinessId(data.business_id);
  };

  const logout = () => {
    localStorage.removeItem('marginmind_token');
    localStorage.removeItem('marginmind_role');
    localStorage.removeItem('marginmind_name');
    localStorage.removeItem('marginmind_biz');
    localStorage.removeItem('marginmind_industry');
    localStorage.removeItem('marginmind_biz_id');
    setToken(null);
  };

  const switchDemoRole = async (targetRole: UserRole) => {
    let domain = 'apexforge.com';
    const ind = (industryType || '').toLowerCase();
    if (ind.includes('textile') || ind.includes('garment') || ind.includes('apparel') || ind.includes('cloth')) {
      domain = 'vardhmantextiles.com';
    } else if (ind.includes('electronic') || ind.includes('smt') || ind.includes('pcba')) {
      domain = 'sahasraelectronics.com';
    } else if (ind.includes('food') || ind.includes('agro') || ind.includes('beverage')) {
      domain = 'naturefreshfoods.com';
    }

    const rolePrefixMap: Record<UserRole, string> = {
      business_owner: 'owner',
      finance_manager: 'finance',
      procurement_manager: 'procurement',
      production_manager: 'production',
    };

    const targetEmail = `${rolePrefixMap[targetRole] || 'owner'}@${domain}`;
    await login(targetEmail, 'password123');
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        role,
        fullName,
        businessName,
        industryType,
        businessId,
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
