import React from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={theme === 'light' ? 'default' : 'ghost'}
        size="icon"
        aria-label="Light mode"
        onClick={() => setTheme('light')}
      >
        <Sun className="w-5 h-5" />
      </Button>
      <Button
        variant={theme === 'dark' ? 'default' : 'ghost'}
        size="icon"
        aria-label="Dark mode"
        onClick={() => setTheme('dark')}
      >
        <Moon className="w-5 h-5" />
      </Button>
      <Button
        variant={theme === 'system' ? 'default' : 'ghost'}
        size="icon"
        aria-label="System mode"
        onClick={() => setTheme('system')}
      >
        <Monitor className="w-5 h-5" />
      </Button>
    </div>
  );
};

export default ThemeToggle;
