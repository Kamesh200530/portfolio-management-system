'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, CheckCircle2, Loader2, Heart, HeartOff } from 'lucide-react';
import { toast } from 'sonner';

const PREFERENCES = ['IT / Software', 'Core Company', 'Government', 'Startup', 'Any Company'] as const;

export function PlacementInterestPoll() {
  const { profile } = useAuth();
  const [interest, setInterest] = useState<'interested' | 'not_interested' | null>(null);
  const [preference, setPreference] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recordId, setRecordId] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    const load = async () => {
      const { data } = await supabase
        .from('placement_interest')
        .select('*')
        .eq('student_id', profile.id)
        .maybeSingle();
      if (data) {
        setRecordId(data.id);
        setInterest(data.interest_status);
        setPreference(data.placement_preference);
      }
      setLoading(false);
    };
    load();
  }, [profile]);

  if (!profile || loading) return null;

  const handleSelectInterest = async (status: 'interested' | 'not_interested') => {
    if (saving) return;
    setSaving(true);
    const newPref = status === 'not_interested' ? null : preference;
    try {
      if (recordId) {
        const { error } = await supabase
          .from('placement_interest')
          .update({ interest_status: status, placement_preference: newPref })
          .eq('id', recordId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('placement_interest')
          .insert({ student_id: profile.id, interest_status: status, placement_preference: newPref })
          .select('id')
          .maybeSingle();
        if (error) throw error;
        if (data) setRecordId(data.id);
      }
      setInterest(status);
      if (status === 'not_interested') setPreference(null);
      toast.success('Your response has been saved.');
    } catch {
      toast.error('Could not save your response. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectPreference = async (pref: string) => {
    if (saving || interest !== 'interested') return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('placement_interest')
        .update({ placement_preference: pref })
        .eq('id', recordId);
      if (error) throw error;
      setPreference(pref);
      toast.success('Your placement preference has been saved.');
    } catch {
      toast.error('Could not save your preference.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-border/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5 text-primary" />
          Placement Interest
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="mb-3 text-sm font-medium">Are you interested in campus placements?</p>
          <div className="flex flex-wrap gap-3">
            <Button
              variant={interest === 'interested' ? 'default' : 'outline'}
              className="gap-2"
              onClick={() => handleSelectInterest('interested')}
              disabled={saving}
            >
              {saving && interest === 'interested' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4 text-success" />}
              Interested
            </Button>
            <Button
              variant={interest === 'not_interested' ? 'default' : 'outline'}
              className="gap-2"
              onClick={() => handleSelectInterest('not_interested')}
              disabled={saving}
            >
              {saving && interest === 'not_interested' ? <Loader2 className="h-4 w-4 animate-spin" /> : <HeartOff className="h-4 w-4 text-destructive" />}
              Not Interested
            </Button>
          </div>
        </div>

        {interest === 'interested' && (
          <div className="animate-fade-in">
            <p className="mb-3 text-sm font-medium">Which type of placement are you interested in?</p>
            <div className="flex flex-wrap gap-2">
              {PREFERENCES.map((p) => (
                <Button
                  key={p}
                  size="sm"
                  variant={preference === p ? 'default' : 'outline'}
                  onClick={() => handleSelectPreference(p)}
                  disabled={saving}
                >
                  {preference === p && <CheckCircle2 className="mr-1 h-3.5 w-3.5" />}
                  {p}
                </Button>
              ))}
            </div>
          </div>
        )}

        {interest && (
          <div className="flex items-center gap-2 rounded-lg bg-success/5 px-3 py-2 text-sm text-success">
            <CheckCircle2 className="h-4 w-4" />
            Your response has been saved.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
