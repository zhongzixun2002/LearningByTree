interface DetailPanelProps {
  open: boolean;
}

export default function DetailPanel({ open }: DetailPanelProps) {
  return (
    <div
      className={`absolute top-0 right-0 h-full w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-xl z-20 transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
    >
      <div className="p-4 text-gray-500 dark:text-gray-400 text-sm">Detail panel</div>
    </div>
  );
}
