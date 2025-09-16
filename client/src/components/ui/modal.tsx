import Image from "next/image";

export default function Modal({ message, onClose }: { message: string; onClose: () => void }) {
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div className="relative bg-gray-200 border border-gray-400 shadow-lg max-w-sm w-full">
        {/* Header Bar */}
        <div className="flex items-center justify-between bg-blue-500 text-white px-2 py-1">
          <span className="font-bold text-sm">System Error</span>
          <button
            onClick={onClose}
            className="text-white border border-gray-300 bg-red-600 text-black hover:bg-red-400 px-2 py-0.5 font-bold"
            style={{ fontSize: "12px", lineHeight: "1" }}
          >
            X
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 flex flex-col items-center gap-4">
          {/* Cat Image */}
          <Image
            src="/cat4.jpeg"
            alt="Cat"
            className="w-30 h-30 object-contain"
          />
          {/* Error Message */}
          <p className="text-black text-sm text-center font-mono">
            {message}
          </p>
          {/* OK Button */}
          <button
            onClick={onClose}
            className="px-4 py-1 border border-gray-400 bg-gray-300 text-black font-bold text-sm hover:bg-gray-400 transition"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}