'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import FileDropzone from '../../../components/FileDropzone';
import { Card } from '../../../components/ui/card';

interface SharePageProps {
  params: Promise<{ id: string }>;
}

export default function SharePageClient({ params }: SharePageProps) {
  // Next.js 15+ params is a Promise, unwrap with React.use()
  const [id, setId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const [key, setKey] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      let resolvedParams: any = params;
      if (typeof (params as any).then === 'function') {
        resolvedParams = await (params as unknown as Promise<any>);
      }
      // Fallback for legacy direct param access
      const paramId = resolvedParams?.id || (params as any)?.id;
      setId(paramId);
      setKey(searchParams.get('key'));
    })();
  }, [params, searchParams]);

  if (!id || !key) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="mb-2 text-2xl font-bold">Invalid Link</div>
        <div className="mb-4 text-muted-foreground">
          Missing transfer room or key.
        </div>
      </div>
    );
  }

  // Render the FileDropzone in receive mode
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] bg-background">
      <Card className="w-full max-w-2xl p-6">
        <h1 className="mb-4 text-2xl font-bold text-center">Receive Files</h1>
        <FileDropzone roomProp={id} keyProp={key} />
      </Card>
    </div>
  );
}
