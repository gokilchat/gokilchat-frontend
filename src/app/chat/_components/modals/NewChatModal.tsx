import { motion, AnimatePresence } from "motion/react";
import { X, User, Users } from "lucide-react";

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDM: () => void;
  onSelectGroup: () => void;
}

export default function NewChatModal({
  isOpen,
  onClose,
  onSelectDM,
  onSelectGroup,
}: NewChatModalProps) {
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
              <h3 className="text-lg font-black text-white">Mulai Chat Baru</h3>
              <button onClick={onClose} className="p-2 hover:bg-elevated rounded-xl transall">
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <button
                onClick={onSelectDM}
                className="w-full p-4 rounded-2xl bg-primary/40 border border-border-divider hover:border-accent-default hover:bg-accent-default/5 flex items-center gap-4 transall group"
              >
                <div className="w-12 h-12 rounded-xl bg-accent-default/10 flexcc text-accent-default group-hover:scale-110 transall">
                  <User className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className="font-black text-white group-hover:text-accent-default transall">Pesan Pribadi (DM)</p>
                  <p className="text-[10px] text-text-secondary font-medium">Ngobrol 1-on-1 lebih privat.</p>
                </div>
              </button>

              <button
                onClick={onSelectGroup}
                className="w-full p-4 rounded-2xl bg-primary/40 border border-border-divider hover:border-accent-default hover:bg-accent-default/5 flex items-center gap-4 transall group"
              >
                <div className="w-12 h-12 rounded-xl bg-accent-default/10 flexcc text-accent-default group-hover:scale-110 transall">
                  <Users className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className="font-black text-white group-hover:text-accent-default transall">Bikin Grup Baru</p>
                  <p className="text-[10px] text-text-secondary font-medium">Kumpulin orang-orang gokil dalam satu room.</p>
                </div>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
