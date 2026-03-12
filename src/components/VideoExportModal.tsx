import { useState, useRef } from 'react';
import { X, Download, Loader, Film, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface VideoExportModalProps {
  videoSequence: string[];
  onClose: () => void;
}

export default function VideoExportModal({ videoSequence, onClose }: VideoExportModalProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [cancelled, setCancelled] = useState(false);
  const cancelledRef = useRef(false);

  const handleCancel = () => {
    cancelledRef.current = true;
    setCancelled(true);
    setExporting(false);
    setStatus('');
    setProgress(0);
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleExport = async () => {
    cancelledRef.current = false;
    setCancelled(false);
    setExporting(true);
    setError('');
    setProgress(0);

    try {
      setStatus(videoSequence.length === 1 ? 'Downloading video...' : 'Joining clips...');
      setProgress(20);

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const edgeUrl = `${supabaseUrl}/functions/v1/join-videos`;

      setProgress(40);

      const response = await fetch(edgeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ videoUrls: videoSequence }),
      });

      if (cancelledRef.current) return;

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errData.error || `Server error: ${response.status}`);
      }

      setProgress(80);
      setStatus('Preparing download...');

      const blob = await response.blob();

      if (cancelledRef.current) return;

      setProgress(95);
      downloadBlob(blob, `animation_${Date.now()}.mp4`);

      setProgress(100);
      setStatus('Done!');
      setTimeout(() => onClose(), 1200);
    } catch (err: unknown) {
      if (cancelledRef.current) return;
      const msg = err instanceof Error ? err.message : 'Export failed. Please try again.';
      setError(msg);
    } finally {
      if (!cancelledRef.current) setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#E70606]/20 rounded-lg flex items-center justify-center">
              <Film className="w-4 h-4 text-[#E70606]" />
            </div>
            <h2 className="font-chakra font-bold text-white text-lg uppercase tracking-wider">
              Export Video
            </h2>
          </div>
          {!exporting && (
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-6 space-y-6">
          <div>
            <p className="text-white/60 text-sm">
              {videoSequence.length} clip{videoSequence.length !== 1 ? 's' : ''} will be{' '}
              {videoSequence.length > 1 ? 'joined and exported as a single MP4' : 'exported as MP4'}
            </p>
          </div>

          {exporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">{status}</span>
                <span className="text-white/60">{progress}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-[#E70606] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {cancelled && !exporting && (
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 text-yellow-400 text-sm">
              Export cancelled.
            </div>
          )}

          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            {exporting ? (
              <button
                onClick={handleCancel}
                className="flex-1 py-3 rounded-lg border border-red-500/40 bg-red-900/20 text-red-400 hover:bg-red-900/40 hover:border-red-500/60 transition-all font-chakra text-sm uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Cancel
              </button>
            ) : (
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all font-chakra text-sm uppercase tracking-wider"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex-1 py-3 rounded-lg bg-[#E70606] hover:bg-[#c00505] disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-chakra text-sm uppercase tracking-wider transition-all hover:scale-105 disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {exporting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Join & Export MP4
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
