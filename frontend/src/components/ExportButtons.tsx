import { useState } from 'react';
import { toast } from 'react-toastify';
import { useLanguage } from '../i18n/LanguageContext';

interface Props {
    weddingId: string;
    typistId?: string;
}

export default function ExportButtons({ weddingId, typistId }: Props) {
    const { t } = useLanguage();
    const [loadingPdf, setLoadingPdf] = useState(false);
    const [loadingExcel, setLoadingExcel] = useState(false);

    const downloadFile = async (type: 'pdf' | 'excel') => {
        const setter = type === 'pdf' ? setLoadingPdf : setLoadingExcel;
        setter(true);
        try {
            let url = `/api/weddings/${weddingId}/report/${type}`;
            if (typistId) url += `?typistId=${typistId}`;
            
            // Get token from localStorage
            const token = localStorage.getItem('adminToken');
            
            // Fetch with Authorization header
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Download failed');

            // Try to get filename from Content-Disposition header
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `${type}_gifts_${weddingId}_${new Date().getTime()}.${type === 'pdf' ? 'pdf' : 'xlsx'}`;

            if (contentDisposition && contentDisposition.includes('filename=')) {
                const parts = contentDisposition.split('filename=');
                if (parts.length > 1) {
                    filename = decodeURIComponent(parts[1].replace(/["']/g, ''));
                }
            }

            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(blobUrl);
            toast.success(`${type.toUpperCase()} downloaded! 📥`);
        } catch { toast.error(`Failed to download ${type.toUpperCase()}`); }
        finally { setter(false); }
    };

    return (
        <div className="export-buttons">
            <button className="btn btn-outline btn-sm" onClick={() => downloadFile('pdf')} disabled={loadingPdf}>
                {loadingPdf ? t.export.generating : t.export.downloadPdf}
            </button>
            <button className="btn btn-success btn-sm" onClick={() => downloadFile('excel')} disabled={loadingExcel}>
                {loadingExcel ? t.export.generating : t.export.downloadExcel}
            </button>
        </div>
    );
}
