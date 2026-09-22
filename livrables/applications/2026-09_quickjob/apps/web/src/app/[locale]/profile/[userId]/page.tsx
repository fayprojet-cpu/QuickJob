'use client';

import { ProfileView } from '@/components/profile/profile-view';

export default function ProfilePage({ params }: { params: { userId: string } }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <ProfileView userId={params.userId} />
    </div>
  );
}
