'use client';

import { useState, useRef, useMemo } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Download, Copy, ExternalLink, QrCode, Check, Loader2, ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

interface PortfolioQRCardProps {
  profileId: string;
  fullName: string;
  departmentName: string;
  portfolioVerified: boolean;
}

function getPublicOrigin(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl && envUrl.trim()) return envUrl.replace(/\/$/, '');
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  if (origin && !/localhost|127\.0\.0\.1|0\.0\.0\.0/.test(origin)) return origin;
  return '';
}

export function PortfolioQRCard({ profileId, fullName, departmentName, portfolioVerified }: PortfolioQRCardProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const portfolioUrl = useMemo(() => {
    const origin = getPublicOrigin();
    return `${origin}/portfolio/${profileId}`;
  }, [profileId]);

  const handleDownload = () => {
    setDownloading(true);
    try {
      const canvas = qrRef.current?.querySelector('canvas');
      if (!canvas) throw new Error('QR canvas not found');
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `portfolio-qr-${profileId}.png`;
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
    try {
      await navigator.clipboard.writeText(portfolioUrl);
      setCopied(true);
      toast.success('Portfolio link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy link');
    }
  };

  return (
    <Card className="border-border/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <QrCode className="h-5 w-5 text-primary" />
          My Verified Portfolio
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          {/* QR Code */}
          <div className="flex flex-col items-center gap-3">
            <div
              ref={qrRef}
              className="rounded-xl border-2 border-border/60 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <QRCodeCanvas
                value={portfolioUrl}
                size={180}
                level="M"
                includeMargin={false}
                fgColor="#0f172a"
                bgColor="#ffffff"
              />
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Scan to view my verified portfolio
            </p>
            {!portfolioUrl.startsWith('http') && (
              <p className="max-w-[180px] rounded-md bg-warning/10 px-2 py-1 text-center text-xs text-warning">
                Set NEXT_PUBLIC_SITE_URL in production for scannable QR codes
              </p>
            )}
          </div>

          {/* Info + Actions */}
          <div className="flex flex-1 flex-col gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{fullName}</span>
                {portfolioVerified ? (
                  <Badge variant="default" className="gap-1 bg-success text-success-foreground">
                    <ShieldCheck className="h-3 w-3" /> Verified
                  </Badge>
                ) : (
                  <Badge variant="secondary">Pending verification</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{departmentName || 'Department not set'}</p>
              <div className="rounded-md bg-muted/50 px-3 py-2">
                <p className="text-xs text-muted-foreground">Portfolio URL</p>
                <p className="truncate text-xs font-mono text-foreground">{portfolioUrl}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="default" className="gap-1.5" onClick={handleDownload} disabled={downloading}>
                {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Download QR
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
              <a href={portfolioUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline" className="gap-1.5">
                  <ExternalLink className="h-4 w-4" />
                  Open Portfolio
                </Button>
              </a>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
