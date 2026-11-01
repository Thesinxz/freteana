"use client";

import React, { useState } from "react";
import { motion, PanInfo } from "framer-motion";
import { Trash2 } from "lucide-react";

interface SwipeableItemProps {
  children: React.ReactNode;
  onDelete: () => void;
  confirmTitle?: string;
}

export function SwipeableItem({
  children,
  onDelete,
  confirmTitle,
}: SwipeableItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (info.offset.x < -45) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(confirmTitle || "Deseja realmente remover este lançamento?")) {
      onDelete();
      setIsOpen(false);
    } else {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative overflow-hidden w-full bg-white">
      {isOpen && (
        <div className="absolute inset-y-0 right-0 w-24 bg-rose-500 flex items-center justify-center text-white z-0">
          <button
            type="button"
            onClick={handleDeleteClick}
            className="w-full h-full flex flex-col items-center justify-center gap-0.5 text-white font-bold text-xs"
          >
            <Trash2 className="w-4 h-4" />
            <span>Remover</span>
          </button>
        </div>
      )}

      <motion.div
        drag="x"
        dragConstraints={{ left: -88, right: 0 }}
        dragElastic={0.06}
        animate={{ x: isOpen ? -88 : 0 }}
        onDragEnd={handleDragEnd}
        onClick={() => {
          if (isOpen) setIsOpen(false);
        }}
        className="bg-white relative z-10 touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  );
}
