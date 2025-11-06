'use client';

import { Navigation } from '@/components/navigation/Navigation';
import { AuthenticationCard } from '@/components/profile/AuthenticationCard';
import { Calendar, GraduationCap } from 'lucide-react';

export default function ProfilePage() {
  return (
    <div className="flex min-h-screen">
      <Navigation />
      <div className="flex-1 bg-zinc-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-zinc-900 mb-8">Profile</h1>

          {/* Third-party Authentication Section */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">
              Third-Party Authentication
            </h2>
            <p className="text-zinc-600 mb-6">
              Connect your accounts to sync your calendar and access course
              materials.
            </p>

            <div className="space-y-4">
              <AuthenticationCard
                provider="calendar"
                title="Google Calendar"
                description="Sync your calendar events"
                icon={Calendar}
                iconColor="bg-blue-500"
              />
              <AuthenticationCard
                provider="moodle"
                title="Moodle"
                description="Access your course materials"
                icon={GraduationCap}
                iconColor="bg-orange-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
