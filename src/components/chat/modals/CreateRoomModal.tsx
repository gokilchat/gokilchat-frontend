import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { useState } from "react";

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

export default function CreateRoomModal({ isOpen, onClose, onSubmit }: CreateRoomModalProps) {
  const [newRoomName, setNewRoomName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    onSubmit(newRoomName);
    setNewRoomName("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flexcc p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-sm bg-secondary border border-border-divider rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-border-divider flex items-center justify-between bg-elevated/20">
              <h3 className="text-lg font-black text-white">Bikin Room Baru</h3>
              <button onClick={onClose} className="p-2 hover:bg-elevated rounded-xl transall">
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <p className="text-xs text-text-secondary mb-4 font-medium leading-relaxed">
                Kasih nama yang gokil buat room baru lu. Jangan yang aneh-aneh ya! 🦁
              </p>
              <div className="relative mb-6">
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Nama room (misal: Markas Gokil)"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full bg-elevated border border-border-subtle rounded-2xl py-4 px-5 text-sm text-text-primary focus:outline-none focus:border-accent-default transall shadow-inner"
                />
              </div>

              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3.5 bg-primary/40 hover:bg-elevated border border-border-divider rounded-2xl text-sm font-bold text-text-secondary transall"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={!newRoomName.trim()}
                  className="flex-1 py-3.5 bg-accent-default hover:bg-accent-hover text-text-on-accent rounded-2xl text-sm font-black transall shadow-lg shadow-accent-default/20 disabled:opacity-30"
                >
                  Bikin Room
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
