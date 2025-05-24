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
    <div className="flex flex-col items-center mt-4 w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto">
      <p className="mb-2 text-base font-medium">
        Scan this QR code to receive:
      </p>
      <QRCode value={qr} size={180} />
      <div className="p-2 mt-2 text-xs break-all rounded select-all bg-muted">
        {qr}
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2 mt-2">
            <Share2 className="w-4 h-4" /> Share
          </Button>
        </PopoverTrigger>
        <PopoverContent className="flex flex-col w-56 gap-2 bg-white dark:bg-stone-600">
          <Button
            variant="ghost"
            className="justify-start gap-2"
            onClick={() => {
              navigator.clipboard.writeText(qr);
              toast.success('Link copied!');
            }}
          >
            <Clipboard className="w-4 h-4" /> Copy Link
          </Button>
          <Button
            variant="ghost"
            className="justify-start gap-2"
            onClick={() => {
              window.open(`https://wa.me/?text=${encodeURIComponent(qr)}`);
            }}
          >
            <Send className="w-4 h-4" /> WhatsApp
          </Button>
          <Button
            variant="ghost"
            className="justify-start gap-2"
            onClick={() => {
              window.open(
                `https://t.me/share/url?url=${encodeURIComponent(qr)}`
              );
            }}
          >
            <MessageCircle className="w-4 h-4" /> Telegram
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
}
