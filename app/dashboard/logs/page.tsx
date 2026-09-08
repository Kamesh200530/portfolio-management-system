'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SectionHeader } from '@/components/dashboards/shared';
import { Badge } from '@/components/ui/badge';
import { Shield, Loader2 } from 'lucide-react';
import type { ActivityLog } from '@/lib/supabase';

export default function LogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(50);
      setLogs((data as ActivityLog[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="animate-fade-in">
      <SectionHeader title="Activity Logs" description="Audit trail of user actions across the platform." />
      <Card className="border-border/40">
        <CardContent className="pt-6">
          {logs.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No activity recorded yet</div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center gap-3 rounded-lg border border-border/40 p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium">{log.action}</span>
                    {log.entity_type && <Badge variant="outline" className="ml-2 text-xs">{log.entity_type}</Badge>}
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
