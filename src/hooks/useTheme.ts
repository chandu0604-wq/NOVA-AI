import { useEffect } from 'react';
import { useChatStore } from '../store';

export function useTheme() {
  const theme = useChatStore(s => s.preferences.theme);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('bg-zinc-950', 'text-zinc-100');
      document.body.classList.add('bg-white', 'text-zinc-900');
    } else {
      document.documentElement.classList.add('dark');
      document.body.classList.remove('bg-white', 'text-zinc-900');
      document.body.classList.add('bg-zinc-950', 'text-zinc-100');
    }
  }, [theme]);

  return theme;
}
