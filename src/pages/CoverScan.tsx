import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, ScanLine, MapPin, BookOpen, ArrowRight, ArrowLeft } from 'lucide-react';
import { Controller, Compiler } from 'mind-ar/dist/mindar-image.prod.js';
import { MOCK_BOOKS } from '../data/mockData';
import { Book } from '../types';
import { cn } from '../lib/utils';
import { useLanguage } from '../hooks/useLanguage';

const TARGET_CACHE_KEY = 'ar_cover_scan_targets_v1';

function targetsFingerprint(): string {
  return MOCK_BOOKS.map((b) => `${b.id}:${b.coverUrl ?? ''}`).join('|');
}

function bufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`image load failed: ${url}`));
    img.src = url;
  });
}

export function CoverScan() {
  const navigate = useNavigate();
  const { t, dir } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchedBook, setMatchedBook] = useState<Book | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      setError(t('cameraUnsupported'));
      return;
    }

    let disposed = false;
    let stream: MediaStream | null = null;
    let controller: InstanceType<typeof Controller> | null = null;

    const onUnexpectedError = (event: ErrorEvent | PromiseRejectionEvent) => {
      if (disposed) return;
      const reason = 'reason' in event ? event.reason : event.error;
      const message = reason instanceof Error ? reason.message : String(reason ?? 'unknown error');
      setError(t('arSetupFailed', { error: message }));
    };
    window.addEventListener('error', onUnexpectedError);
    window.addEventListener('unhandledrejection', onUnexpectedError);

    async function getTargetBuffer(): Promise<ArrayBuffer> {
      const fingerprint = targetsFingerprint();
      try {
        const cachedRaw = localStorage.getItem(TARGET_CACHE_KEY);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          if (cached.fingerprint === fingerprint) {
            return base64ToBuffer(cached.data);
          }
        }
      } catch {
        // Corrupt/old cache entry - fall through and recompile.
      }

      const images = await Promise.all(MOCK_BOOKS.map((b) => loadImage(b.coverUrl ?? '')));
      const compiler = new Compiler();
      await compiler.compileImageTargets(images, (percent: number) => {
        if (!disposed) setProgress(Math.round(percent));
      });
      const buffer: ArrayBuffer = compiler.exportData();

      try {
        localStorage.setItem(TARGET_CACHE_KEY, JSON.stringify({ fingerprint, data: bufferToBase64(buffer) }));
      } catch {
        // Cache is best-effort; ignore quota errors.
      }
      return buffer;
    }

    async function setup() {
      // Same rear-camera-forcing logic proven necessary for the shelf AR mode:
      // some Android tablets ignore a soft facingMode:"environment" hint.
      let rearCameraId: string | undefined;
      try {
        const probeStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: 'environment' } },
        });
        probeStream.getTracks().forEach((track) => track.stop());
        const devices = await navigator.mediaDevices.enumerateDevices();
        rearCameraId = devices.find(
          (d) => d.kind === 'videoinput' && /back|rear|environment/i.test(d.label)
        )?.deviceId;
      } catch {
        // Fall back to a plain "environment" request below.
      }
      if (disposed) return;

      try {
        const buffer = await getTargetBuffer();
        if (disposed) return;

        stream = await navigator.mediaDevices.getUserMedia({
          video: rearCameraId
            ? { deviceId: { exact: rearCameraId } }
            : { facingMode: { ideal: 'environment' } },
        });
        if (disposed) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        video!.srcObject = stream;
        await video!.play();
        await new Promise<void>((resolve) => {
          if (video!.readyState >= 1) resolve();
          else video!.addEventListener('loadedmetadata', () => resolve(), { once: true });
        });
        if (disposed) return;

        controller = new Controller({
          inputWidth: video!.videoWidth,
          inputHeight: video!.videoHeight,
          missTolerance: 24,
          warmupTolerance: 3,
          onUpdate: (data: { type: string; targetIndex: number; worldMatrix: number[] | null }) => {
            if (disposed || data.type !== 'updateMatrix') return;
            if (data.worldMatrix !== null) {
              setMatchedBook(MOCK_BOOKS[data.targetIndex] ?? null);
            } else {
              setMatchedBook((current) => {
                const currentIndex = current ? MOCK_BOOKS.findIndex((b) => b.id === current.id) : -1;
                return currentIndex === data.targetIndex ? null : current;
              });
            }
          },
        });
        await controller.addImageTargetsFromBuffer(buffer);
        if (disposed) return;

        controller.dummyRun(video);
        controller.processVideo(video);
        setReady(true);
      } catch (err) {
        if (!disposed) setError(t('arSetupFailed', { error: err instanceof Error ? err.message : String(err) }));
      }
    }
    setup();

    return () => {
      disposed = true;
      window.removeEventListener('error', onUnexpectedError);
      window.removeEventListener('unhandledrejection', onUnexpectedError);
      controller?.stopProcessVideo();
      controller?.dispose();
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [t]);

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden font-sans" dir={dir}>
      <video
        ref={videoRef}
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(rgba(217,179,16,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(217,179,16,0.1) 1px, transparent 1px)',
            backgroundSize: '100px 100px',
          }}
        />
      </div>

      {!matchedBook && !error && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none gap-6 text-center px-10">
          <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <ScanLine className="w-16 h-16 text-accent" />
          </motion.div>
          <p className="text-white font-black text-sm uppercase tracking-widest">
            {ready ? t('scanningForCover') : t('preparingCoverRecognition')}
          </p>
          {!ready && (
            <div className="w-56 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-accent transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          )}
          {ready && <p className="text-white/60 font-bold text-xs max-w-xs">{t('pointCameraAtCoverLabel')}</p>}
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none px-10">
          <p className="text-white font-black text-sm text-center">{error}</p>
        </div>
      )}

      <div className={cn('absolute top-10 z-20 flex items-center gap-4', dir === 'rtl' ? 'right-8' : 'left-8')}>
        <div className="glass-panel px-6 py-4 bg-white/5 border-white/20 backdrop-blur-xl">
          <div className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">{t('coverScanTitle')}</div>
        </div>
      </div>

      <button
        onClick={() => navigate(-1)}
        className={cn('absolute top-10 z-20 p-5 bg-primary/20 hover:bg-primary border-white/20 backdrop-blur-xl rounded-[1.5rem] text-white transition-all shadow-2xl active:scale-90', dir === 'rtl' ? 'left-8' : 'right-8')}
      >
        <X className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {matchedBook && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            className="absolute inset-x-0 bottom-0 z-30 p-6"
          >
            <div className={cn('official-card bg-white dark:bg-slate-900 p-6 flex items-center gap-5 shadow-2xl', dir === 'rtl' ? 'flex-row-reverse text-right' : 'flex-row text-left')}>
              <img
                src={matchedBook.coverUrl}
                alt={matchedBook.title}
                className="w-16 h-20 object-cover rounded-xl shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 min-w-0 space-y-1">
                <h4 className="font-black text-primary dark:text-white text-sm leading-tight line-clamp-1">{matchedBook.title}</h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">{matchedBook.author}</p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => navigate(`/book/${matchedBook.id}`)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-primary dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    {t('viewDetails')}
                  </button>
                  <button
                    onClick={() => navigate('/map', { state: { bookId: matchedBook.id } })}
                    className="px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center gap-1.5"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    {t('goToShelf')}
                    {dir === 'rtl' ? <ArrowLeft className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                  </button>
                </div>
              </div>
              <BookOpen className="w-5 h-5 text-accent shrink-0" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
