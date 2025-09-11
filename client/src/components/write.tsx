import { useState } from "react";
import { Rnd } from "react-rnd";

export default function Write({
  isFocused,
  onClose,
  onFocus,
}: {
  isFocused: boolean;
  onClose: () => void;
  onFocus: () => void;
}) {
  const [color, setColor] = useState("red");

  return (
    <Rnd
      default={{
        x: 10,
        y: 10,
        width: 480,
        height: 360,
      }}
      bounds="parent"
      minWidth={300}
      minHeight={200}
      onDragStart={onFocus}
      onResizeStart={onFocus}
      style={{
        zIndex: isFocused ? 100 : 10,
        pointerEvents: "auto",
        border: "2px solid black",
        background: "white",
        boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
      }}
    >
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center bg-blue-800 text-white px-2 py-1 cursor-default">
          <span>Write</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            ×
          </button>
        </div>
        <div className="flex flex-col items-center justify-center flex-1 gap-4">
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              backgroundColor: color,
            }}
          />
          <button
            onClick={() => setColor(color === "red" ? "blue" : "red")}
            className="px-4 py-2 border rounded bg-gray-100"
          >
            Change Color
          </button>
        </div>
      </div>
    </Rnd>
  );
}
