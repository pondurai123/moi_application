import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useLanguage } from '../i18n/LanguageContext';
import client from '../api/client';

interface AdminUser {
    id: number;
    username: string;
    role: 'SUPER_ADMIN' | 'ADMIN';
    createdAt: string;
}

export default function AdminManagementPage() {
    const { t: _t } = useLanguage();  // Unused but imported from dependency
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingUserId, setEditingUserId] = useState<number | null>(null);
    const [showPasswordForm, setShowPasswordForm] = useState<number | null>(null);

    // Form states
    const [createForm, setCreateForm] = useState({ username: '', password: '', role: 'ADMIN' as 'SUPER_ADMIN' | 'ADMIN' });
    const [editForm, setEditForm] = useState({ username: '', role: 'ADMIN' as 'SUPER_ADMIN' | 'ADMIN' });
    const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await client.get('/admin/users');
            setUsers(response.data.users);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!createForm.username || !createForm.password) {
            toast.error('Username and password are required');
            return;
        }

        try {
            await client.post('/admin/users', {
                username: createForm.username,
                password: createForm.password,
                role: createForm.role,
            });
            toast.success('User created successfully! ✨');
            setCreateForm({ username: '', password: '', role: 'ADMIN' });
            setShowCreateForm(false);
            fetchUsers();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to create user');
        }
    };

    const handleUpdateUser = async (userId: number) => {
        if (!editForm.username) {
            toast.error('Username is required');
            return;
        }

        try {
            await client.put(`/admin/users/${userId}`, {
                username: editForm.username,
                role: editForm.role,
            });
            toast.success('User updated successfully! ✨');
            setEditingUserId(null);
            fetchUsers();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to update user');
        }
    };

    const handleChangePassword = async (userId: number) => {
        if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
            toast.error('Please fill in all password fields');
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        try {
            await client.put(`/admin/users/${userId}/password`, {
                newPassword: passwordForm.newPassword,
            });
            toast.success('Password updated successfully! ✨');
            setShowPasswordForm(null);
            setPasswordForm({ newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to update password');
        }
    };

    const handleDeleteUser = async (userId: number) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            await client.delete(`/admin/users/${userId}`);
            toast.success('User deleted successfully! ✨');
            fetchUsers();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to delete user');
        }
    };

    const startEdit = (user: AdminUser) => {
        setEditingUserId(user.id);
        setEditForm({ username: user.username, role: user.role as 'SUPER_ADMIN' | 'ADMIN' });
    };

    const cancelEdit = () => {
        setEditingUserId(null);
        setEditForm({ username: '', role: 'ADMIN' });
    };

    return (
        <div className="page-container">
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div className="hero" style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '2rem' }}>Admin Management</h1>
                    <p>Create, manage, and delete admin users</p>
                </div>

                {/* Create User Button */}
                <div style={{ marginBottom: '24px' }}>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        style={{ marginRight: '12px' }}
                    >
                        {showCreateForm ? 'Cancel' : '+ Create New Admin'}
                    </button>
                </div>

                {/* Create User Form */}
                {showCreateForm && (
                    <div className="card" style={{ marginBottom: '24px' }}>
                        <h3 style={{ marginBottom: '16px' }}>Create New Admin User</h3>
                        <form onSubmit={handleCreateUser}>
                            <div className="form-group">
                                <label>Username</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={createForm.username}
                                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                                    placeholder="Enter username"
                                />
                            </div>

                            <div className="form-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    value={createForm.password}
                                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                                    placeholder="Enter password (min 6 characters)"
                                />
                            </div>

                            <div className="form-group">
                                <label>Role</label>
                                <select
                                    className="form-control"
                                    value={createForm.role}
                                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as 'SUPER_ADMIN' | 'ADMIN' })}
                                >
                                    <option value="ADMIN">Admin (Settings & Functions only)</option>
                                    <option value="SUPER_ADMIN">Super Admin (Full Access)</option>
                                </select>
                            </div>

                            <button type="submit" className="btn btn-success" style={{ width: '100%' }}>
                                Create User
                            </button>
                        </form>
                    </div>
                )}

                {/* Users List */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>Loading users...</div>
                ) : users.length === 0 ? (
                    <div className="empty-state">
                        <div className="icon">👤</div>
                        <p>No admin users found</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                    <th style={{ textAlign: 'left', padding: '12px' }}>Username</th>
                                    <th style={{ textAlign: 'left', padding: '12px' }}>Role</th>
                                    <th style={{ textAlign: 'left', padding: '12px' }}>Created</th>
                                    <th style={{ textAlign: 'center', padding: '12px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '12px' }}>
                                            {editingUserId === user.id ? (
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={editForm.username}
                                                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                                                    style={{ maxWidth: '200px' }}
                                                />
                                            ) : (
                                                <span style={{ fontWeight: 500 }}>{user.username}</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            {editingUserId === user.id ? (
                                                <select
                                                    className="form-control"
                                                    value={editForm.role}
                                                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as 'SUPER_ADMIN' | 'ADMIN' })}
                                                    style={{ maxWidth: '200px' }}
                                                >
                                                    <option value="ADMIN">Admin</option>
                                                    <option value="SUPER_ADMIN">Super Admin</option>
                                                </select>
                                            ) : (
                                                <span
                                                    style={{
                                                        display: 'inline-block',
                                                        padding: '4px 12px',
                                                        borderRadius: 'var(--radius)',
                                                        backgroundColor:
                                                            user.role === 'SUPER_ADMIN' ? 'rgba(168,85,247,0.2)' : 'rgba(59,130,246,0.2)',
                                                        color: user.role === 'SUPER_ADMIN' ? '#a855f7' : '#3b82f6',
                                                        fontSize: '0.85rem',
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {user.role === 'SUPER_ADMIN' ? '👑 Super Admin' : '⚙️ Admin'}
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            {new Date(user.createdAt).toLocaleDateString('en-IN')}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            {editingUserId === user.id ? (
                                                <>
                                                    <button
                                                        onClick={() => handleUpdateUser(user.id)}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            color: 'var(--success)',
                                                            cursor: 'pointer',
                                                            fontSize: '0.9rem',
                                                            marginRight: '12px',
                                                            textDecoration: 'underline',
                                                        }}
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={cancelEdit}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            color: 'var(--text-muted)',
                                                            cursor: 'pointer',
                                                            fontSize: '0.9rem',
                                                            textDecoration: 'underline',
                                                        }}
                                                    >
                                                        Cancel
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => startEdit(user)}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            color: 'var(--primary)',
                                                            cursor: 'pointer',
                                                            fontSize: '0.9rem',
                                                            marginRight: '12px',
                                                            textDecoration: 'underline',
                                                        }}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => setShowPasswordForm(showPasswordForm === user.id ? null : user.id)}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            color: '#f59e0b',
                                                            cursor: 'pointer',
                                                            fontSize: '0.9rem',
                                                            marginRight: '12px',
                                                            textDecoration: 'underline',
                                                        }}
                                                    >
                                                        Password
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            color: '#f44336',
                                                            cursor: 'pointer',
                                                            fontSize: '0.9rem',
                                                            textDecoration: 'underline',
                                                        }}
                                                    >
                                                        Delete
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Password Change Form */}
                {showPasswordForm && (
                    <div className="card" style={{ marginTop: '24px' }}>
                        <h3 style={{ marginBottom: '16px' }}>Change Password</h3>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleChangePassword(showPasswordForm);
                            }}
                        >
                            <div className="form-group">
                                <label>New Password</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                    placeholder="Enter new password"
                                />
                            </div>

                            <div className="form-group">
                                <label>Confirm Password</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                    placeholder="Confirm new password"
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button type="submit" className="btn btn-success" style={{ flex: 1 }}>
                                    Update Password
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => {
                                        setShowPasswordForm(null);
                                        setPasswordForm({ newPassword: '', confirmPassword: '' });
                                    }}
                                    style={{ flex: 1 }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
