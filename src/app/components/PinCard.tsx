import { useDrag } from "react-dnd";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { X } from "lucide-react";
import { motion } from "motion/react";

interface PinCardProps {
  id: string;
  text: string;
  type: string;
  color: "yellow" | "green" | "blue" | "purple";
  author: string;
  onRemove: (id: string) => void;
}

const COLORS = {
  yellow: "bg-yellow-100 border-yellow-300 text-yellow-900",
  green: "bg-green-100 border-green-300 text-green-900",
  blue: "bg-blue-100 border-blue-300 text-blue-900",
  purple: "bg-purple-100 border-purple-300 text-purple-900",
};

export function PinCard({ id, text, type, color, author, onRemove }: PinCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "pin",
    item: { id, text, type, color, author },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <motion.div
      ref={drag}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: isDragging ? 0.5 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={`relative rounded-lg border-2 p-4 cursor-move ${COLORS[color]} ${
        isDragging ? "shadow-lg" : ""
      }`}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(id);
        }}
        className="absolute -top-2 -right-2 size-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-md z-10"
      >
        <X className="size-4" />
      </button>
      <p className="italic mb-3 min-h-[80px]">{text}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs opacity-60">{type}</span>
        <Avatar className="size-6">
          <AvatarFallback className="text-xs bg-white/50">{author}</AvatarFallback>
        </Avatar>
      </div>
    </motion.div>
  );
}
