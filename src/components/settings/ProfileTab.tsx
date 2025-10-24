'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function ProfileTab() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
  });

  useEffect(() => {
    if (session?.user) {
      setFormData({
        name: session.user.name || '',
        email: session.user.email || '',
        phone: '', // Load from user data
        bio: '',
      });
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Profile updated successfully!');
        await update(); // Refresh session
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white light:text-gray-900 mb-2">
          Profile Information
        </h2>
        <p className="text-gray-400 light:text-gray-600">
          Update your personal information and profile picture
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Section */}
        <div className="flex items-center gap-6 p-6 bg-white/5 rounded-xl light:bg-gray-50">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              {session?.user?.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-white">
                  {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white light:text-gray-900 mb-1">
              Profile Picture
            </h3>
            <p className="text-sm text-gray-400 light:text-gray-600 mb-3">
              JPG, PNG or GIF. Max size 2MB.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-all"
              >
                Upload New
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white light:bg-gray-200 light:text-gray-700 light:hover:bg-gray-300 rounded-lg text-sm font-semibold transition-all"
              >
                Remove
              </button>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-200 light:text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white light:bg-white light:border-gray-300 light:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-200 light:text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-gray-400 light:bg-gray-100 light:border-gray-300 light:text-gray-600 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              Email cannot be changed
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-200 light:text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white light:bg-white light:border-gray-300 light:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+1 234 567 8900"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-200 light:text-gray-700 mb-2">
              Account Type
            </label>
            <input
              type="text"
              value="Premium"
              disabled
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-gray-400 light:bg-gray-100 light:border-gray-300 light:text-gray-600 cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-200 light:text-gray-700 mb-2">
            Bio
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white light:bg-white light:border-gray-300 light:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Tell us about yourself..."
          />
        </div>

        {/* Messages */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
            {success}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => setFormData({
              name: session?.user?.name || '',
              email: session?.user?.email || '',
              phone: '',
              bio: '',
            })}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white light:bg-gray-200 light:text-gray-700 light:hover:bg-gray-300 rounded-xl font-semibold transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
