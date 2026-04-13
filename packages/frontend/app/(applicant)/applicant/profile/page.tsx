'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import api, { extractError } from '@/lib/api';
import { MOCK_APPLICANT_PROFILE } from '@/lib/demo';
import { useToastStore } from '@/lib/store';
import {
  User, Mail, Phone, MapPin, Briefcase, GraduationCap,
  Award, Edit, FileText,
} from 'lucide-react';

interface Profile {
  fullName: string;
  email?: string;
  phone?: string;
  region?: string;
  city?: string;
  bio?: string;
  completionScore: number;
  referralCode?: string;
  skills: { id: string; name: string }[];
  workExperiences: { id: string; companyName: string; title: string; startDate: string; endDate?: string; current: boolean }[];
  educations: { id: string; institution: string; degree: string; fieldOfStudy: string; graduationYear: number }[];
  cvUrl?: string;
}

export default function ApplicantProfilePage() {
  const addToast = useToastStore((s) => s.addToast);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/applicants/profile')
      .then((res) => setProfile(res.data.data))
      .catch(() => setProfile(MOCK_APPLICANT_PROFILE))
      .finally(() => setLoading(false));
  }, [addToast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold mb-2">Profile not found</h2>
        <Button asChild><Link href="/applicant/profile/build">Build Your Profile</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <Button asChild>
          <Link href="/applicant/profile/build"><Edit className="h-4 w-4 mr-2" /> Edit Profile</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="h-20 w-20 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
              <User className="h-10 w-10 text-brand" />
            </div>
            <div className="flex-1 space-y-2">
              <h2 className="text-xl font-bold">{profile.fullName}</h2>
              {profile.bio && <p className="text-muted-foreground text-sm">{profile.bio}</p>}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {profile.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {profile.email}</span>}
                {profile.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {profile.phone}</span>}
                {profile.region && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {profile.city ? `${profile.city}, ` : ''}{profile.region}</span>}
              </div>
              {profile.referralCode && <p className="text-xs text-muted-foreground">Referral Code: <code className="bg-muted px-1.5 py-0.5 rounded">{profile.referralCode}</code></p>}
            </div>
            <div className="text-center shrink-0">
              <p className="text-xs text-muted-foreground mb-1">Profile Completion</p>
              <Progress value={profile.completionScore} className="w-32 h-2" />
              <p className="text-sm font-semibold mt-1">{profile.completionScore}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Award className="h-5 w-5" /> Skills</CardTitle></CardHeader>
          <CardContent>
            {profile.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((s) => <Badge key={s.id} variant="secondary">{s.name}</Badge>)}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No skills added yet. <Link href="/applicant/profile/build" className="text-primary underline">Add skills</Link></p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> CV / Resume</CardTitle></CardHeader>
          <CardContent>
            {profile.cvUrl ? (
              <a href={profile.cvUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">View uploaded CV</a>
            ) : (
              <p className="text-sm text-muted-foreground">No CV uploaded. <Link href="/applicant/profile/build" className="text-primary underline">Upload now</Link></p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5" /> Work Experience</CardTitle></CardHeader>
          <CardContent>
            {profile.workExperiences.length > 0 ? (
              <div className="space-y-4">
                {profile.workExperiences.map((w) => (
                  <div key={w.id} className="border-l-2 border-brand pl-4">
                    <h4 className="font-medium">{w.title}</h4>
                    <p className="text-sm text-muted-foreground">{w.companyName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(w.startDate).toLocaleDateString()} — {w.current ? 'Present' : w.endDate ? new Date(w.endDate).toLocaleDateString() : ''}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No work experience added. <Link href="/applicant/profile/build" className="text-primary underline">Add experience</Link></p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5" /> Education</CardTitle></CardHeader>
          <CardContent>
            {profile.educations.length > 0 ? (
              <div className="space-y-4">
                {profile.educations.map((e) => (
                  <div key={e.id} className="border-l-2 border-brand-accent pl-4">
                    <h4 className="font-medium">{e.degree} in {e.fieldOfStudy}</h4>
                    <p className="text-sm text-muted-foreground">{e.institution}</p>
                    <p className="text-xs text-muted-foreground">Class of {e.graduationYear}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No education added. <Link href="/applicant/profile/build" className="text-primary underline">Add education</Link></p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
