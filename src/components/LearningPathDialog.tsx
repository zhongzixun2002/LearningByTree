interface LearningPathDialogProps {
  onClose: () => void;
}

export default function LearningPathDialog({ onClose }: LearningPathDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="text-gray-500 dark:text-gray-400 text-sm">Learning path dialog</div>
      </div>
    </div>
  );
}
