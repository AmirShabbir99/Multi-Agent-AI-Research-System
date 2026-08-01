import { useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, FileText } from 'lucide-react';
import clsx from 'clsx';

const ACCEPTED = ['.pdf', '.docx', '.txt', '.md'];

export default function UploadDropzone({ onUpload, uploading }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = useCallback(
    (fileList) => {
      const file = fileList?.[0];
      if (!file) return;
      const ext = `.${file.name.split('.').pop().toLowerCase()}`;
      if (!ACCEPTED.includes(ext)) {
        onUpload(null, `'${ext}' isn't supported. Allowed: ${ACCEPTED.join(', ')}`);
        return;
      }
      onUpload(file);
    },
    [onUpload]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => !uploading && inputRef.current?.click()}
      className={clsx(
        'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed px-6 py-10 text-center transition-colors',
        dragOver
          ? 'border-brass bg-brass/5'
          : 'border-ink/15 hover:border-ink/30 dark:border-paper/15 dark:hover:border-paper/30',
        uploading && 'pointer-events-none opacity-60'
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {uploading ? (
        <>
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-brass border-t-transparent" />
          <p className="text-sm font-medium text-ink dark:text-paper">Uploading and indexing...</p>
          <p className="text-xs text-ink/45 dark:text-paper/45">Extracting text, chunking, and embedding</p>
        </>
      ) : (
        <>
          <UploadCloud size={26} className="text-ink/35 dark:text-paper/35" />
          <p className="text-sm font-medium text-ink dark:text-paper">Drop a file here, or click to browse</p>
          <p className="flex items-center gap-1 text-xs text-ink/45 dark:text-paper/45">
            <FileText size={12} /> PDF, DOCX, TXT or Markdown - up to 20MB
          </p>
        </>
      )}
    </motion.div>
  );
}
