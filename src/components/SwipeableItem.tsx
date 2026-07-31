"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";

interface SwipeableItemProps {
  children: React.ReactNode;
  onDelete: () => void;
  confirmTitle?: string;
}

export function SwipeableItem({ children, onDelete, confirmTitle }: SwipeableItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x < -40) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(confirmTitle || "Deseja realmente excluir este lançamento?")) {
      onDelete();
    } else {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative overflow-hidden w-full bg-red-600">
      {/* Background Delete Action */}
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-red-600 to-rose-600 flex items-center justify-center text-white z-0">
        <button
          onClick={handleDeleteClick}
          className="w-full h-full flex flex-col items-center justify-center space-y-1 text-white active:scale-95 transition-transform"
        >
          <Trash2 className="w-5 h-5 text-white" />
          <span className="text-[10px] font-black uppercase tracking-wider">Excluir</span>
        </button>
      </div>

      {/* Foreground Draggable Content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -90, right: 0 }}
        dragElastic={0.08}
        animate={{ x: isOpen ? -90 : 0 }}
        onDragEnd={handleDragEnd}
        onClick={() => {
          if (isOpen) setIsOpen(false);
        }}
        className="bg-white/95 backdrop-blur-md relative z-10 touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  );
}
