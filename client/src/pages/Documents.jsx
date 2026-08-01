import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { RefreshCw, FileStack } from 'lucide-react';
import { documentApi } from '../api/document.api';
import { aiApi } from '../api/ai.api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import UploadDropzone from '../components/documents/UploadDropzone';
import DocumentCard from '../components/documents/DocumentCard';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { Skeleton, EmptyState, Spinner } from '../components/ui/Primitives';

export default function Documents() {
  const { user } = useAuth();
  const toast = useToast();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [summaryTarget, setSummaryTarget] = useState(null);
  const [summaryText, setSummaryText] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);

  const loadDocuments = async () => {
    try {
      const { data } = await documentApi.list({ limit: 100 });
      setDocuments(data.data);
    } catch {
      toast.error('Could not load documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpload = async (file, validationError) => {
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setUploading(true);
    try {
      const { data } = await documentApi.upload(file);
      setDocuments((prev) => [data.data, ...prev]);
      toast.success(`"${file.name}" uploaded and indexed.`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (document) => {
    if (!window.confirm(`Delete "${document.displayName}"? This removes it from the vector index permanently.`)) return;
    try {
      await documentApi.remove(document._id);
      setDocuments((prev) => prev.filter((d) => d._id !== document._id));
      toast.success('Document deleted.');
    } catch {
      toast.error('Could not delete document.');
    }
  };

  const handleSummarize = async (document) => {
    setSummaryTarget(document);
    setSummaryText(document.cachedSummary || '');
    if (document.cachedSummary) return;

    setSummaryLoading(true);
    try {
      const { data } = await aiApi.summarize({ documentId: document._id, length: 'medium' });
      setSummaryText(data.data.summary);
      setDocuments((prev) => prev.map((d) => (d._id === document._id ? { ...d, cachedSummary: data.data.summary } : d)));
    } catch {
      toast.error('Could not generate a summary.');
      setSummaryTarget(null);
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleRebuild = async () => {
    if (!window.confirm('Rebuild the entire vector index from scratch? This may take a while for many documents.')) return;
    setRebuilding(true);
    try {
      const { data } = await documentApi.rebuildVectorDb();
      toast.success(`Rebuilt: ${data.data.documents_processed} document(s), ${data.data.total_chunks} chunks.`);
      loadDocuments();
    } catch {
      toast.error('Vector database rebuild failed.');
    } finally {
      setRebuilding(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 md:px-10 md:py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-ink dark:text-paper md:text-3xl">Documents</h1>
          <p className="mt-1 text-sm text-ink/55 dark:text-paper/55">
            Upload reference material for the assistant to search and cite from.
          </p>
        </div>
        {user?.role === 'admin' && (
          <Button variant="secondary" size="sm" onClick={handleRebuild} loading={rebuilding}>
            <RefreshCw size={14} /> Rebuild vector index
          </Button>
        )}
      </div>

      <div className="mt-6">
        <UploadDropzone onUpload={handleUpload} uploading={uploading} />
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <EmptyState icon={FileStack} title="No documents yet" description="Upload your first document to start asking questions about it." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {documents.map((doc) => (
                <DocumentCard key={doc._id} document={doc} onDelete={handleDelete} onSummarize={handleSummarize} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <Modal open={Boolean(summaryTarget)} onClose={() => setSummaryTarget(null)} title={summaryTarget?.displayName} maxWidth="max-w-lg">
        {summaryLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-ink/60 dark:text-paper/60">
            <Spinner size={18} /> Generating summary...
          </div>
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink/80 dark:text-paper/80">{summaryText}</p>
        )}
      </Modal>
    </div>
  );
}
