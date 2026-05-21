interface SearchModalProps {
  onClose: () => void;
}

export default function SearchModal({ onClose }: SearchModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-24" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg p-4" onClick={(e) => e.stopPropagation()}>
        <div className="text-gray-500 dark:text-gray-400 text-sm">Search modal</div>
      </div>
    </div>
  );
}
