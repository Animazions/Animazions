import { ShieldCheck, ShieldX, Clock, AlertTriangle, ExternalLink } from 'lucide-react';
import { KYCStatus } from '../hooks/useKYCStatus';

interface KYCStatusBannerProps {
  kycStatus: KYCStatus;
  kycSessionUrl?: string | null;
  onStartKYC: () => void;
}

export function KYCStatusBanner({ kycStatus, kycSessionUrl, onStartKYC }: KYCStatusBannerProps) {
  if (kycStatus === 'approved') {
    return (
      <div className="flex items-center gap-3 bg-green-900/20 border border-green-700 rounded-xl px-5 py-4">
        <ShieldCheck className="w-5 h-5 text-green-400 flex-shrink-0" />
        <div>
          <p className="text-green-400 font-chakra text-sm uppercase font-bold tracking-wider">KYC Verified</p>
          <p className="text-green-300/70 text-xs mt-0.5">Your identity has been successfully verified</p>
        </div>
      </div>
    );
  }

  if (kycStatus === 'initiated') {
    return (
      <div className="flex items-center justify-between gap-3 bg-yellow-900/20 border border-yellow-700 rounded-xl px-5 py-4">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <div>
            <p className="text-yellow-400 font-chakra text-sm uppercase font-bold tracking-wider">Verification Incomplete</p>
            <p className="text-yellow-300/70 text-xs mt-0.5">You started KYC but haven't finished. Resume to complete it.</p>
          </div>
        </div>
        {kycSessionUrl ? (
          <a
            href={kycSessionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 flex items-center gap-1.5 bg-yellow-600 hover:bg-yellow-500 text-white font-chakra uppercase text-xs px-4 py-2 rounded-lg transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Resume KYC
          </a>
        ) : (
          <button
            onClick={onStartKYC}
            className="flex-shrink-0 bg-yellow-600 hover:bg-yellow-500 text-white font-chakra uppercase text-xs px-4 py-2 rounded-lg transition-all"
          >
            Resume KYC
          </button>
        )}
      </div>
    );
  }

  if (kycStatus === 'pending') {
    return (
      <div className="flex items-center gap-3 bg-yellow-900/20 border border-yellow-700 rounded-xl px-5 py-4">
        <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0" />
        <div>
          <p className="text-yellow-400 font-chakra text-sm uppercase font-bold tracking-wider">Verification Pending</p>
          <p className="text-yellow-300/70 text-xs mt-0.5">Your KYC is being reviewed. This usually takes a few minutes.</p>
        </div>
      </div>
    );
  }

  if (kycStatus === 'rejected') {
    return (
      <div className="flex items-center justify-between gap-3 bg-red-900/20 border border-red-700 rounded-xl px-5 py-4">
        <div className="flex items-center gap-3">
          <ShieldX className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-red-400 font-chakra text-sm uppercase font-bold tracking-wider">Verification Failed</p>
            <p className="text-red-300/70 text-xs mt-0.5">Your identity verification was not successful</p>
          </div>
        </div>
        <button
          onClick={onStartKYC}
          className="flex-shrink-0 bg-red-700 hover:bg-red-600 text-white font-chakra uppercase text-xs px-4 py-2 rounded-lg transition-all"
        >
          Retry KYC
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 bg-gray-800/60 border border-gray-600 rounded-xl px-5 py-4">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
        <div>
          <p className="text-gray-200 font-chakra text-sm uppercase font-bold tracking-wider">Not KYC Verified</p>
          <p className="text-gray-400 text-xs mt-0.5">Complete identity verification to participate in token sales</p>
        </div>
      </div>
      <button
        onClick={onStartKYC}
        className="flex-shrink-0 bg-[#E70606] hover:bg-[#c00505] text-white font-chakra uppercase text-xs px-4 py-2 rounded-lg transition-all hover:scale-105"
      >
        Complete KYC
      </button>
    </div>
  );
}
