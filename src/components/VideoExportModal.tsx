import { useState, useRef } from 'react';
import { X, Download, Loader, Film } from 'lucide-react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

interface VideoExportModalProps {
  videoSequence: string[];
  onClose: () => void;
}

type OutputFormat = 'mp4' | 'avi' | 'mov' | 'webm' | 'mkv';

interface FormatOption {
  value: OutputFormat;
  label: string;
  mimeType: string;
  codec: string[];
  description: string;
}

const FORMAT_OPTIONS: FormatOption[] = [
  {
    value: 'mp4',
    label: 'MP4',
    mimeType: 'video/mp4',
    codec: ['-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-movflags', '+faststart'],
    description: 'Best compatibility, recommended',
  },
  {
    value: 'webm',
    label: 'WebM',
    mimeType: 'video/webm',
    codec: ['-c:v', 'libvpx-vp9', '-crf', '30', '-b:v', '0'],
    description: 'Open format, good for web',
  },
  {
    value: 'mov',
    label: 'MOV',
    mimeType: 'video/quicktime',
    codec: ['-c:v', 'libx264', '-preset', 'fast', '-crf', '23'],
    description: 'Apple QuickTime format',
  },
  {
    value: 'avi',
    label: 'AVI',
    mimeType: 'video/x-msvideo',
    codec: ['-c:v', 'libx264', '-preset', 'fast'],
    description: 'Classic Windows format',
  },
  {
    value: 'mkv',
    label: 'MKV',
    mimeType: 'video/x-matroska',
    codec: ['-c:v', 'libx264', '-preset', 'fast', '-crf', '23'],
    description: 'Open container, great quality',
  },
];

export default function VideoExportModal({ videoSequence, onClose }: VideoExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<OutputFormat>('mp4');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const ffmpegRef = useRef<FFmpeg | null>(null);

  const handleExport = async () => {
    setExporting(true);
    setError('');
    setProgress(0);
    setStatus('Loading FFmpeg...');

    try {
      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;

      ffmpeg.on('progress', ({ progress: p }) => {
        setProgress(Math.round(p * 100));
      });

      ffmpeg.on('log', ({ message }) => {
        if (message.includes('frame=') || message.includes('time=')) {
          setStatus('Encoding...');
        }
      });

      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      setStatus('Downloading videos...');

      const inputFiles: string[] = [];
      for (let i = 0; i < videoSequence.length; i++) {
        const url = videoSequence[i];
        setStatus(`Downloading video ${i + 1} of ${videoSequence.length}...`);
        const fileData = await fetchFile(url);
        const inputName = `input${i}.mp4`;
        await ffmpeg.writeFile(inputName, fileData);
        inputFiles.push(inputName);
      }

      setStatus('Creating concat list...');
      const concatContent = inputFiles.map(f => `file '${f}'`).join('\n');
      const encoder = new TextEncoder();
      await ffmpeg.writeFile('concat.txt', encoder.encode(concatContent));

      setStatus('Joining and encoding...');
      const fmt = FORMAT_OPTIONS.find(f => f.value === selectedFormat)!;
      const outputFile = `output.${selectedFormat}`;

      await ffmpeg.exec([
        '-f', 'concat',
        '-safe', '0',
        '-i', 'concat.txt',
        ...fmt.codec,
        outputFile,
      ]);

      setStatus('Preparing download...');
      const data = await ffmpeg.readFile(outputFile);
      const blob = new Blob([data], { type: fmt.mimeType });

      if (blob.size === 0) throw new Error('Output file is empty. Encoding may have failed.');

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `animation_${Date.now()}.${selectedFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatus('Done!');
      setTimeout(() => onClose(), 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Export failed. Please try again.';
      setError(msg);
    } finally {
      setExporting(false);
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
            <p className="text-white/60 text-sm mb-1">
              {videoSequence.length} video{videoSequence.length !== 1 ? 's' : ''} will be joined
            </p>
          </div>

          <div>
            <label className="block text-white/80 text-sm font-chakra uppercase tracking-wider mb-3">
              Output Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              {FORMAT_OPTIONS.map((fmt) => (
                <button
                  key={fmt.value}
                  onClick={() => !exporting && setSelectedFormat(fmt.value)}
                  disabled={exporting}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedFormat === fmt.value
                      ? 'border-[#E70606] bg-[#E70606]/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="font-chakra font-bold text-white text-sm">{fmt.label}</div>
                  <div className="text-white/40 text-xs mt-0.5">{fmt.description}</div>
                </button>
              ))}
            </div>
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

          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            {!exporting && (
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
                  Export {selectedFormat.toUpperCase()}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
