import { useState, useRef } from 'react';
import { X, Download, Loader, Film, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import JSZip from 'jszip';

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

  const fetchVideoBlob = async (url: string, index: number): Promise<Blob> => {
    const isSupabaseStorage = url.includes('/storage/v1/object/sign/') || url.includes('/storage/v1/object/public/');

    if (isSupabaseStorage) {
      const pathMatch = url.match(/\/storage\/v1\/object\/(?:sign|public)\/generated-videos\/(.+?)(?:\?|$)/);
      if (pathMatch) {
        const filePath = decodeURIComponent(pathMatch[1]);
        const { data, error: dlError } = await supabase.storage
          .from('generated-videos')
          .download(filePath);
        if (dlError) throw new Error(`Failed to download video ${index + 1}: ${dlError.message}`);
        if (!data) throw new Error(`No data for video ${index + 1}`);
        return data;
      }
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch video ${index + 1}: ${res.status} ${res.statusText}`);
    return res.blob();
  };

  const handleExport = async () => {
    cancelledRef.current = false;
    setCancelled(false);
    setExporting(true);
    setError('');
    setProgress(0);

    try {
      if (videoSequence.length === 1) {
        setStatus('Downloading video...');
        setProgress(20);
        const blob = await fetchVideoBlob(videoSequence[0], 0);
        if (cancelledRef.current) return;
        setProgress(90);
        setStatus('Preparing download...');
        downloadBlob(blob, `animation_${Date.now()}.mp4`);
        setProgress(100);
        setStatus('Done!');
        setTimeout(() => onClose(), 1200);
        return;
      }

      const blobs: Blob[] = [];
      for (let i = 0; i < videoSequence.length; i++) {
        if (cancelledRef.current) return;
        setStatus(`Downloading clip ${i + 1} of ${videoSequence.length}...`);
        setProgress(Math.round(((i) / videoSequence.length) * 70));
        const blob = await fetchVideoBlob(videoSequence[i], i);
        blobs.push(blob);
      }

      if (cancelledRef.current) return;
      setStatus('Packaging clips...');
      setProgress(80);

      if (blobs.length === 1) {
        downloadBlob(blobs[0], `animation_${Date.now()}.mp4`);
      } else {
        const zip = new JSZip();
        blobs.forEach((blob, i) => {
          zip.file(`clip_${String(i + 1).padStart(2, '0')}.mp4`, blob);
        });
        const zipBlob = await zip.generateAsync({ type: 'blob' }, (meta) => {
          setProgress(80 + Math.round(meta.percent * 0.2));
        });
        if (cancelledRef.current) return;
        downloadBlob(zipBlob, `animation_clips_${Date.now()}.zip`);
      }

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
              {videoSequence.length} clip{videoSequence.length !== 1 ? 's' : ''} will be exported
            </p>
            {videoSequence.length > 1 && (
              <p className="text-white/40 text-xs mt-1">
                Multiple clips will be packaged as a .zip file
              </p>
            )}
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
                  Export {videoSequence.length > 1 ? 'ZIP' : 'MP4'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
