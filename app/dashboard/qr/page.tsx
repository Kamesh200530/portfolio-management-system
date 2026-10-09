'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { SectionHeader } from '@/components/dashboards/shared';
import { toast } from 'sonner';
import {
  Download, Copy, ExternalLink, QrCode, Check, Loader2, ShieldCheck,
  Share2, Printer, RefreshCw, Hash,
} from 'lucide-react';

function getPublicOrigin(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl && envUrl.trim()) return envUrl.replace(/\/$/, '');
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    if (origin && !/localhost|127\.0\.0\.1|0\.0\.0\.0|webcontainer|bolt\.new/.test(origin)) {
      return origin;
    }
  }
  return '';
}

export default function QRPage() {
  const { profile } = useAuth();
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [portfolioId, setPortfolioId] = useState('');
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profile) return;
    if (profile.department_id) {
      supabase.from('departments').select('name,code').eq('id', profile.department_id).maybeSingle().then(({ data }) => {
        if (data) {
          setDeptName((data as { name: string; code: string }).name);
          const code = (data as { code: string }).code || 'GEN';
          const year = new Date(profile.created_at).getFullYear().toString();
          const seq = profile.id.replace(/-/g, '').slice(0, 4).toUpperCase();
          setPortfolioId(`PORT-${code}-${year}-${seq}`);
        }
      });
    } else {
      const year = new Date(profile.created_at).getFullYear().toString();
      const seq = profile.id.replace(/-/g, '').slice(0, 4).toUpperCase();
      setPortfolioId(`PORT-GEN-${year}-${seq}`);
    }
  }, [profile]);

  const portfolioUrl = useMemo(() => {
    const origin = getPublicOrigin();
    return origin && profile ? `${origin}/portfolio/${profile.id}` : '';
  }, [profile]);

  if (!profile) return null;

  const handleDownload = () => {
    setDownloading(true);
    try {
      const canvas = qrRef.current?.querySelector('canvas');
      if (!canvas) throw new Error('QR canvas not found');
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `portfolio-qr-${profile.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('QR code downloaded');
    } catch {
      toast.error('Could not download QR code');
    } finally {
      setDownloading(false);
    }
  };

  const handleCopy = async () => {
    if (!portfolioUrl) { toast.error('No portfolio URL available'); return; }
    try {
      await navigator.clipboard.writeText(portfolioUrl);
      setCopied(true);
      toast.success('Portfolio link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy link');
    }
  };

  const handleShare = async () => {
    if (!portfolioUrl) { toast.error('No portfolio URL available'); return; }
    if (navigator.share) {
      try {
        await navigator.share({ title: `${profile.full_name}'s Portfolio`, url: portfolioUrl });
      } catch { /* user cancelled */ }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title="My Portfolio QR Code"
        description="Share your portfolio with recruiters, faculty, and peers by scanning or downloading your QR code."
      />

      {!portfolioUrl && (
        <Card className="mb-6 border-warning/30 bg-warning/5">
          <CardContent className="pt-6">
            <p className="text-sm text-warning">
              A deployed application URL is required for a scannable QR code. The QR will become active once the app is deployed.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(320px,400px)_1fr]">
        {/* QR Code Card */}
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <QrCode className="h-5 w-5 text-primary" /> QR Code
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div ref={qrRef} className="rounded-2xl border-2 border-border/60 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              {portfolioUrl ? (
                <QRCodeCanvas
                  value={portfolioUrl}
                  size={256}
                  level="H"
                  includeMargin={false}
                  fgColor="#0f172a"
                  bgColor="#ffffff"
                />
              ) : (
                <div className="flex h-[256px] w-[256px] items-center justify-center text-center text-sm text-muted-foreground">
                  QR code available after deployment
                </div>
              )}
            </div>
            <p className="text-center text-sm text-muted-foreground">Scan to view my verified portfolio</p>

            <div className="flex flex-wrap justify-center gap-2">
              <Button size="sm" onClick={handleDownload} disabled={downloading || !portfolioUrl} className="gap-1.5">
                {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Download QR
              </Button>
              <Button size="sm" variant="outline" onClick={handleCopy} disabled={!portfolioUrl} className="gap-1.5">
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
              <Button size="sm" variant="outline" onClick={handleShare} disabled={!portfolioUrl} className="gap-1.5">
                <Share2 className="h-4 w-4" /> Share
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Portfolio Info Card */}
        <div className="space-y-6">
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle className="text-lg">Portfolio Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {profile.full_name?.charAt(0) || 'S'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{profile.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{deptName || 'Department not set'}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {profile.portfolio_verified ? (
                      <Badge variant="default" className="gap-1 bg-success text-success-foreground">
                        <ShieldCheck className="h-3 w-3" /> Verified
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Pending verification</Badge>
                    )}
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Hash className="h-4 w-4" /> Portfolio ID
                  </span>
                  <span className="font-mono text-sm font-medium">{portfolioId || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <RefreshCw className="h-4 w-4" /> Last Updated
                  </span>
                  <span className="text-sm font-medium">{new Date(profile.updated_at).toLocaleDateString()}</span>
                </div>
                <div className="rounded-md bg-muted/50 px-3 py-2">
                  <p className="text-xs text-muted-foreground">Portfolio URL</p>
                  <p className="truncate text-xs font-mono text-foreground">{portfolioUrl || 'Available after deployment'}</p>
                </div>
              </div>
              <a href={portfolioUrl || undefined} target="_blank" rel="noopener noreferrer" aria-disabled={!portfolioUrl} className={!portfolioUrl ? 'pointer-events-none opacity-50' : undefined}>
                <Button variant="outline" className="w-full gap-1.5">
                  <ExternalLink className="h-4 w-4" /> Open My Portfolio
                </Button>
              </a>
            </CardContent>
          </Card>

          {/* Printable QR Card */}
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Printer className="h-5 w-5 text-primary" /> Printable QR Card
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Print a wallet-sized QR card to share at interviews, job fairs, or campus events.
              </p>
              <div className="printable-qr-card mx-auto max-w-sm rounded-xl border-2 border-border/60 bg-white p-6 text-center text-slate-900 shadow-md">
                <div className="mb-3 flex items-center justify-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <QrCode className="h-4 w-4" />
                  </div>
                  <span className="font-bold">PortfolioMS</span>
                </div>
                <div ref={(el) => { if (el && qrRef.current && !el.querySelector('canvas')) { const canvas = qrRef.current.querySelector('canvas'); if (canvas) el.appendChild(canvas.cloneNode(true)); } }} className="flex justify-center" />
                <p className="mt-3 text-lg font-bold">{profile.full_name}</p>
                <p className="text-xs text-slate-600">{deptName || 'Department not set'}</p>
                <p className="mt-1 font-mono text-xs text-slate-500">{portfolioId || '—'}</p>
                <p className="mt-2 text-xs text-slate-400">Scan to view verified portfolio</p>
              </div>
              <Button onClick={() => window.print()} variant="outline" className="mt-4 w-full gap-1.5">
                <Printer className="h-4 w-4" /> Print QR Card
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .printable-qr-card, .printable-qr-card * { visibility: visible; }
          .printable-qr-card { position: absolute; left: 50%; top: 30%; transform: translateX(-50%); border: 2px solid #e2e8f0; }
        }
      `}</style>
    </div>
  );
}
