import { useState } from 'react';
import { X, ShieldCheck, Loader, AlertCircle, ExternalLink } from 'lucide-react';

interface KYCModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartKYC: () => Promise<{ session_url: string | null; error: string | null }>;
  onKYCComplete: () => void;
}

export function KYCModal({ isOpen, onClose, onStartKYC, onKYCComplete }: KYCModalProps) {
  const [step, setStep] = useState<'intro' | 'loading' | 'iframe' | 'error'>('intro');
  const [sessionUrl, setSessionUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBeginKYC = async () => {
    setStep('loading');
    setError(null);
    const { session_url, error: err } = await onStartKYC();
    if (err || !session_url) {
      setError(err ?? 'Could not start verification. Please try again.');
      setStep('error');
      return;
    }
    setSessionUrl(session_url);
    setStep('iframe');
  };

  const handleClose = () => {
    setStep('intro');
    setSessionUrl(null);
    setError(null);
    onClose();
  };

  const handleIframeMessage = (event: MessageEvent) => {
    if (event.data?.type === 'DIDIT_VERIFICATION_COMPLETE' || event.data?.status === 'approved') {
      onKYCComplete();
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`bg-gray-900 border border-gray-700 rounded-2xl w-full overflow-hidden transition-all ${
        step === 'iframe' ? 'max-w-2xl' : 'max-w-md'
      }`}>
        <div className="bg-[#E70606] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5" />
            <h2 className="font-krona text-sm uppercase tracking-wider">Identity Verification</h2>
          </div>
          <button onClick={handleClose} className="text-white hover:text-gray-200 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {step === 'intro' && (
          <div className="p-8">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center">
                <ShieldCheck className="w-10 h-10 text-[#E70606]" />
              </div>
            </div>

            <h3 className="font-jost text-xl font-bold text-center mb-3">KYC Verification Required</h3>
            <p className="text-gray-400 text-center text-sm leading-relaxed mb-6">
              To participate in the token sale, you must complete identity verification (KYC). This is a one-time process that takes approximately 2-3 minutes.
            </p>

            <div className="space-y-3 mb-8">
              {[
                'Government-issued photo ID',
                'A brief selfie or liveness check',
                'Secure processing — data is encrypted',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-gray-800 rounded-lg px-4 py-3">
                  <div className="w-5 h-5 rounded-full bg-[#E70606] flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold">{i + 1}</span>
                  </div>
                  <span className="text-sm text-gray-300">{item}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleBeginKYC}
              className="w-full bg-[#E70606] hover:bg-[#c00505] text-white font-chakra uppercase text-sm py-4 rounded-lg transition-all hover:scale-105 font-bold tracking-wider"
            >
              Begin Verification
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              Powered by Didit — ISO 27001 certified & GDPR compliant
            </p>
          </div>
        )}

        {step === 'loading' && (
          <div className="p-12 flex flex-col items-center gap-4">
            <Loader className="w-10 h-10 text-[#E70606] animate-spin" />
            <p className="text-gray-400 font-jost">Preparing your verification session...</p>
          </div>
        )}

        {step === 'iframe' && sessionUrl && (
          <div className="flex flex-col">
            <div className="px-4 py-3 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
              <p className="text-xs text-gray-400 font-jost">Complete verification in the window below</p>
              <a
                href={sessionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-[#E70606] hover:text-red-400 transition-colors"
              >
                Open in new tab <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <iframe
              src={sessionUrl}
              className="w-full"
              style={{ height: '600px', border: 'none' }}
              allow="camera; microphone"
              onLoad={() => {
                window.addEventListener('message', handleIframeMessage);
              }}
            />
            <div className="p-4 border-t border-gray-700">
              <button
                onClick={() => { onKYCComplete(); handleClose(); }}
                className="w-full border border-gray-600 hover:border-[#E70606] text-gray-300 hover:text-white font-chakra uppercase text-xs py-3 rounded-lg transition-all"
              >
                I have completed verification
              </button>
            </div>
          </div>
        )}

        {step === 'error' && (
          <div className="p-8">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-red-900/20 border border-red-700 flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
            </div>
            <h3 className="font-jost text-xl font-bold text-center mb-3">Verification Error</h3>
            <p className="text-red-400 text-center text-sm mb-6">{error}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setStep('intro')}
                className="flex-1 bg-[#E70606] hover:bg-[#c00505] text-white font-chakra uppercase text-sm py-3 rounded-lg transition-all"
              >
                Try Again
              </button>
              <button
                onClick={handleClose}
                className="flex-1 border border-gray-600 text-gray-300 font-chakra uppercase text-sm py-3 rounded-lg transition-all hover:border-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
