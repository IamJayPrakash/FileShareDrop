import QRCode from 'react-qr-code';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Share2, Send, MessageCircle, Clipboard } from 'lucide-react';
import { toast } from 'sonner';

export default function QRShare({ qr }: { qr: string }) {
  return (
    <div className="flex flex-col items-center gap-4 mt-6 w-full">
      <div className="flex flex-col items-center bg-gradient-to-br from-blue-50/80 to-blue-100/60 dark:from-gray-800/80 dark:to-gray-900/60 rounded-2xl shadow-lg p-6 w-full max-w-xs border border-blue-100 dark:border-gray-700 animate-fade-in">
        <p className="mb-3 text-lg font-semibold text-primary dark:text-primary-dark-300 text-center">
          Scan this QR code to receive:
        </p>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-3 shadow-md mb-3 border border-blue-200 dark:border-gray-800">
          <QRCode
            value={qr}
            size={160}
            bgColor="transparent"
            fgColor="#2563eb"
          />
        </div>
        <div
          className="p-2 mt-1 text-xs break-all rounded-lg select-all bg-muted/80 dark:bg-muted-dark/80 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 cursor-pointer transition hover:bg-blue-50 dark:hover:bg-gray-800"
          title="Click to copy link"
          onClick={() => {
            navigator.clipboard.writeText(qr);
            toast.success('Link copied!');
          }}
        >
          {qr}
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button className="flex items-center gap-2 mt-4 w-full justify-center">
              <Share2 className="w-4 h-4" /> Share
            </Button>
          </PopoverTrigger>
          <PopoverContent className="flex flex-col w-56 gap-2 bg-white dark:bg-stone-700 border border-blue-100 dark:border-gray-700 shadow-xl rounded-xl animate-fade-in">
            <Button
              variant="ghost"
              className="justify-start gap-2 hover:bg-blue-50 dark:hover:bg-gray-800"
              onClick={() => {
                navigator.clipboard.writeText(qr);
                toast.success('Link copied!');
              }}
            >
              <Clipboard className="w-4 h-4" /> Copy Link
            </Button>
            <Button
              variant="ghost"
              className="justify-start gap-2 hover:bg-green-50 dark:hover:bg-gray-800"
              onClick={() => {
                window.open(`https://wa.me/?text=${encodeURIComponent(qr)}`);
              }}
            >
              <Send className="w-4 h-4 text-green-600" /> WhatsApp
            </Button>
            <Button
              variant="ghost"
              className="justify-start gap-2 hover:bg-blue-50 dark:hover:bg-gray-800"
              onClick={() => {
                window.open(
                  `https://t.me/share/url?url=${encodeURIComponent(qr)}`
                );
              }}
            >
              <MessageCircle className="w-4 h-4 text-blue-500" /> Telegram
            </Button>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
