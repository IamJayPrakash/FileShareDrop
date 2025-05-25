'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import FileDropzone from '../../../components/FileDropzone';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Download, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface SharePageProps {
  params: Promise<{ id: string }>;
}

export default function SharePageClient({ params }: SharePageProps) {
  const [id, setId] = useState<string | null>(null);
  const [key, setKey] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      let resolvedParams: any = params;
      if (typeof (params as any).then === 'function') {
        resolvedParams = await (params as unknown as Promise<any>);
      }
      const paramId = resolvedParams?.id || (params as any)?.id;
      setId(paramId);
      setKey(searchParams.get('key'));
    })();
  }, [params, searchParams]);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        when: 'beforeChildren',
        staggerChildren: 0.2,
      },
    },
  };

  const childVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  if (!id || !key) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center min-h-[60vh] bg-gradient-to-r from-primary/10 to-secondary/10 dark:from-black dark:to-zinc-800"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Card className="w-full max-w-md p-6 bg-gradient-to-r from-primary/10 to-secondary/10 dark:bg-zinc-900/90 dark:from-black dark:to-zinc-800 backdrop-blur-md shadow-lg rounded-lg">
          <motion.div
            variants={childVariants}
            className="flex flex-col items-center gap-4"
          >
            <AlertCircle className="w-12 h-12 text-destructive dark:text-red-400" />
            <h1 className="text-2xl font-bold text-destructive dark:text-red-400">
              Invalid Link
            </h1>
            <p className="text-sm text-muted-foreground text-center dark:text-zinc-300">
              Missing transfer room or key. Please check the URL and try again.
            </p>
            <Button
              className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-primary dark:text-primary-foreground"
              onClick={() => router.push('/')}
            >
              Return to Home
            </Button>
          </motion.div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[60vh] bg-gradient-to-r from-primary/10 to-secondary/10 dark:from-black dark:to-zinc-800 py-12"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Card className="w-full max-w-3xl p-8">
        <motion.div
          variants={childVariants}
          className="flex flex-col items-center gap-4"
        >
          <Download className="w-12 h-12 text-zinc-900 dark:text-zinc-400" />
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 relative group">
            Receive Files
            <span className="absolute left-0 bottom-0 w-full h-0.5 bg-primary dark:bg-zinc-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
          </h1>
          <p className="text-sm text-muted-foreground text-center max-w-md dark:text-zinc-300">
            Securely receive your files via WebRTC. Keep this page open to start
            the transfer.
          </p>
        </motion.div>
        <motion.div variants={childVariants} className="mt-6 w-full">
          <FileDropzone roomProp={id} keyProp={key} />
        </motion.div>
      </Card>
    </motion.div>
  );
}
