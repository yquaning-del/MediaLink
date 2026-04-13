'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

interface CandidateProfile {
  id: string;
  fullName: string;
  region?: string;
  district?: string;
  professionalSummary?: string;
  skills: string[];
  completionScore: number;
  cvUrl?: string;
  workExperiences: { role: string; companyName: string; isCurrent: boolean; startDate: string; endDate?: string; responsibilities?: string }[];
  educations: { institution: string; qualification: string; graduationYear: number }[];
  preferredJobTypes: string[];
  preferredRegions: string[];
}

interface MatchInfo {
  score: number;
  jobTitle: string;
  applicationId: string;
}

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [match, setMatch] = useState<MatchInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/applicants/profile/${id}`),
      api.get(`/employers/candidates/${id}/match`).catch(() => ({ data: { data: null } })),
    ]).then(([profileRes, matchRes]) => {
      setProfile(profileRes.data.data);
      setMatch(matchRes.data.data);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B4F72]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <p className="text-slate-500">Candidate not found or you don&apos;t have access.</p>
        <button onClick={() => router.back()} className="mt-4 text-[#1B4F72] font-semibold text-sm hover:underline">← Back</button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-700 text-sm">← Back</button>
      </div>

      {/* Header */}
      <div className="bg-[#1B4F72] rounded-xl p-6 text-white">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0">
            {profile.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{profile.fullName}</h1>
            {profile.region && <p className="text-blue-200 text-sm mt-0.5">📍 {profile.region}</p>}
            <div className="mt-3 flex items-center gap-3">
              <div className="bg-white/10 rounded-lg px-3 py-1.5">
                <p className="text-xs text-blue-200">Profile Score</p>
                <p className="text-lg font-bold">{profile.completionScore}%</p>
              </div>
              {match && (
                <div className="bg-white/10 rounded-lg px-3 py-1.5">
                  <p className="text-xs text-blue-200">Match for {match.jobTitle}</p>
                  <p className="text-lg font-bold">{Math.round(match.score)}%</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Professional Summary */}
      {profile.professionalSummary && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-base font-bold text-slate-900 mb-3">Professional Summary</h2>
          <p className="text-sm text-slate-700 leading-relaxed">{profile.professionalSummary}</p>
        </div>
      )}

      {/* Skills */}
      {profile.skills.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-base font-bold text-slate-900 mb-3">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((s) => (
              <span key={s} className="text-sm bg-blue-50 text-[#1B4F72] font-medium px-3 py-1 rounded-full">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Work Experience */}
      {profile.workExperiences.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-base font-bold text-slate-900 mb-3">Work Experience</h2>
          <div className="space-y-4">
            {profile.workExperiences.map((exp, i) => (
              <div key={i} className="pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                <p className="font-semibold text-slate-900">{exp.role}</p>
                <p className="text-sm text-slate-600">{exp.companyName}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {new Date(exp.startDate).getFullYear()} — {exp.isCurrent ? 'Present' : exp.endDate ? new Date(exp.endDate).getFullYear() : ''}
                </p>
                {exp.responsibilities && (
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">{exp.responsibilities}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {profile.educations.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-base font-bold text-slate-900 mb-3">Education</h2>
          <div className="space-y-3">
            {profile.educations.map((edu, i) => (
              <div key={i} className="pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                <p className="font-semibold text-slate-900">{edu.qualification}</p>
                <p className="text-sm text-slate-600">{edu.institution}</p>
                <p className="text-xs text-slate-400 mt-0.5">{edu.graduationYear}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preferences */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-base font-bold text-slate-900 mb-3">Preferences</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-slate-700 mb-1">Job Types</p>
            <div className="flex flex-wrap gap-1">
              {profile.preferredJobTypes.map((t) => (
                <span key={t} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs">{t.replace('_', ' ')}</span>
              ))}
            </div>
          </div>
          <div>
            <p className="font-medium text-slate-700 mb-1">Preferred Regions</p>
            <div className="flex flex-wrap gap-1">
              {profile.preferredRegions.map((r) => (
                <span key={r} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs">{r}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CV */}
      {profile.cvUrl && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <a
            href={profile.cvUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#1B4F72] hover:underline"
          >
            📄 View CV / Resume
          </a>
        </div>
      )}

      {/* Apply action */}
      {match?.applicationId && (
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-4 flex items-center justify-between">
          <p className="text-sm text-[#1B4F72] font-medium">This candidate has applied for {match.jobTitle}</p>
          <button
            onClick={() => router.push('/employer/applications')}
            className="text-sm font-bold text-[#1B4F72] hover:underline"
          >
            View Application →
          </button>
        </div>
      )}
    </div>
  );
}
