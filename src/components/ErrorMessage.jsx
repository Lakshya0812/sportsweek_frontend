import { AlertCircle } from 'lucide-react';

export default function ErrorMessage({ message = 'Something went wrong.' }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-red-900/30 border border-red-700/50 rounded-lg text-red-400">
      <AlertCircle size={18} className="shrink-0" />
      <span className="text-sm">{message}</span>
    </div>
  );
}
