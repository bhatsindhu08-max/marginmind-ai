import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { User, UserRole } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../contexts/AuthContext';
import { Users, Plus, ShieldCheck, Mail, Lock, X } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const { role } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New user form
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('password123');
  const [userRole, setUserRole] = useState<UserRole>('production_manager');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<User[]>('/business/users');
      setUsers(data);
    } catch (e) {
      console.error('Failed to load users:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/business/users', {
        method: 'POST',
        body: JSON.stringify({
          email,
          full_name: fullName,
          password,
          role: userRole,
        }),
      });
      setShowAddModal(false);
      setEmail('');
      setFullName('');
      await loadUsers();
    } catch (e: any) {
      alert('Failed to add user: ' + e.message);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-mono">Loading Enterprise RBAC Directory...</span>
        </div>
      </div>
    );
  }

  const isOwner = role === 'business_owner';

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              Role-Based Access Control (RBAC)
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
              Enterprise Security
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage authorized enterprise team members across Business Owner, Finance Manager, Procurement Manager, and Production Manager roles.
          </p>
        </div>
        {isOwner && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Member</span>
          </button>
        )}
      </div>

      {/* Roles & Permissions Matrix */}
      <div className="glass-panel rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider mb-4">
          RBAC Permissions Structure
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg">
            <span className="font-bold text-emerald-400 block font-sans">Business Owner</span>
            <span className="text-[11px] text-slate-400 block mt-1">
              Full authority, decision approval, user management, and company-wide strategic threshold settings.
            </span>
          </div>
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg">
            <span className="font-bold text-cyan-400 block font-sans">Finance Manager</span>
            <span className="text-[11px] text-slate-400 block mt-1">
              Cost sheets, pricing models, margin guard, financial forecasts, and break-even viability.
            </span>
          </div>
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg">
            <span className="font-bold text-amber-400 block font-sans">Procurement Manager</span>
            <span className="text-[11px] text-slate-400 block mt-1">
              Suppliers, quotations, purchase records, supply shock alerts, and material index linkages.
            </span>
          </div>
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg">
            <span className="font-bold text-purple-400 block font-sans">Production Manager</span>
            <span className="text-[11px] text-slate-400 block mt-1">
              BOMs, inventory stocks, manufacturing overheads, machine capacities, and order feasibility.
            </span>
          </div>
        </div>
      </div>

      {/* Users Directory Table */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
            Active Team Members ({users.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">User Name</th>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3.5 px-4 font-sans font-semibold text-slate-100">{u.full_name}</td>
                  <td className="py-3.5 px-4 text-slate-400">{u.email}</td>
                  <td className="py-3.5 px-4 capitalize text-emerald-400 font-medium">
                    {u.role.replace('_', ' ')}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <StatusBadge status={u.is_active ? 'HEALTHY' : 'CRITICAL'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateUser}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100">Invite Enterprise Member</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ramesh Kulkarni"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">Work Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ramesh@apexforge.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">Assign RBAC Role</label>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as UserRole)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100"
              >
                <option value="business_owner">Business Owner (Full Authority)</option>
                <option value="finance_manager">Finance Manager</option>
                <option value="procurement_manager">Procurement Manager</option>
                <option value="production_manager">Production Manager</option>
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-lg"
              >
                Create Member
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
