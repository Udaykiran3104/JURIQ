import React from 'react';
import { motion } from 'framer-motion';

export function TypingIndicator() {
  const dotVariants = {
    animate: {
      y: [0, -8, 0],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          variants={dotVariants}
          animate="animate"
          style={{ animationDelay: `${index * 0.2}s` }}
          className="w-2 h-2 bg-doj-orange dark:bg-doj-orange rounded-full"
        />
      ))}
    </div>
  );
}