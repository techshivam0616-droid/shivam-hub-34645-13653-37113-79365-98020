import { useState, useEffect } from 'react';
import { usePopupSettings } from '@/hooks/usePopupSettings';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const getTextColorClass = (color: string) => {
  switch (color) {
    case 'primary':
      return 'text-primary';
    case 'red':
      return 'text-red-500';
    case 'blue':
      return 'text-blue-500';
    case 'green':
      return 'text-green-500';
    default:
      return 'text-foreground';
  }
};

const getFontFamilyClass = (font: string) => {
  switch (font) {
    case 'serif':
      return 'font-serif';
    case 'mono':
      return 'font-mono';
    case 'sans':
      return 'font-sans';
    case 'cursive':
      return 'font-[cursive]';
    default:
      return '';
  }
};

export function HomePopup() {
  const { settings, loading } = usePopupSettings();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!loading && settings.enabled && settings.text) {
      setIsVisible(true);
    }
  }, [loading, settings]);

  if (!isVisible || loading) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6 space-y-4 border">
        <div className="flex items-start justify-between gap-4">
          <p
            className={`flex-1 text-base leading-relaxed ${getTextColorClass(settings.textColor)} ${getFontFamilyClass(settings.fontFamily)}`}
          >
            {settings.text}
          </p>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => setIsVisible(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {settings.linkUrl && settings.linkName && (
          <div className="flex items-center justify-between pt-2 border-t">
            <a
              href={settings.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              {settings.linkName}
            </a>
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsVisible(false)}
            >
              Close
            </Button>
          </div>
        )}

        {(!settings.linkUrl || !settings.linkName) && (
          <div className="flex justify-end pt-2 border-t">
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsVisible(false)}
            >
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
