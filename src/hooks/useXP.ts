/**
 * The XP total, kept live.
 *
 * calcXP() reads localStorage, which React has no way to watch — so a screen
 * that called it during render kept showing whatever the number was when that
 * screen last rendered. Earning 100 XP left the header on its old total until
 * something unrelated caused a re-render, usually the next navigation. For a
 * feature whose whole promise is that points arrive *now*, a header that
 * updates on the next page is the one thing that must not happen.
 *
 * Anything that changes the total calls notifyXPChanged(); every display
 * subscribes through this hook.
 */

import { useEffect, useState } from 'react';
import { calcXP, XP_CHANGED_EVENT } from '../lib/utils';

export function useXP(): number {
  const [xp, setXp] = useState(calcXP);

  useEffect(() => {
    const sync = () => setXp(calcXP());
    window.addEventListener(XP_CHANGED_EVENT, sync);
    // 'storage' covers the same account open in a second tab, which the
    // custom event never reaches — it does not fire in the tab that wrote.
    window.addEventListener('storage', sync);
    // A tab that was in the background may have missed events entirely.
    document.addEventListener('visibilitychange', sync);
    sync();
    return () => {
      window.removeEventListener(XP_CHANGED_EVENT, sync);
      window.removeEventListener('storage', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);

  return xp;
}
