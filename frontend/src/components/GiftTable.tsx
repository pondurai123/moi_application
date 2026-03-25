import { useLanguage } from '../i18n/LanguageContext';

interface Gift {
    id: number;
    donorName: string;
    donorPlace: string;
    amount: number;
    receiptNumber?: string;
    typistName?: string;
    typistId?: number;
    denominations?: { denomination: number; quantity: number }[];
    createdAt: string;
}

interface Props {
    gifts: Gift[];
    totalAmount: number;
    showTypist?: boolean;
    onEdit?: (gift: Gift) => void;
    onDelete?: (giftId: number) => void;
    onPrint?: (giftId: number) => void;
}

export default function GiftTable({ gifts, totalAmount, showTypist, onEdit, onDelete, onPrint }: Props) {
    const { t } = useLanguage();

    if (gifts.length === 0) {
        return (
            <div className="empty-state">
                <div className="icon">🎁</div>
                <p>{t.gifts.noGiftsYet}</p>
            </div>
        );
    }

    return (
        <div className="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th style={{ width: '40px' }}>{t.table.serial}</th>
                        <th style={{ width: '80px' }}>{t.table.receipt}</th>
                        <th>{t.table.donorName}</th>
                        <th>{t.table.place}</th>
                        {showTypist && <th>{t.table.typist}</th>}
                        <th style={{ textAlign: 'right' }}>{t.table.amount}</th>
                        {(onEdit || onDelete || onPrint) && <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>}
                    </tr>
                </thead>
                <tbody>
                    {gifts.map((gift, idx) => (
                        <tr key={gift.id}>
                            <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{idx + 1}</td>
                            <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{gift.receiptNumber || '-'}</td>
                            <td style={{ fontWeight: 500 }}>{gift.donorName}</td>
                            <td style={{ color: 'var(--text-muted)' }}>{gift.donorPlace}</td>
                            {showTypist && <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{gift.typistName || '-'}</td>}
                            <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--success)' }}>
                                ₹{parseFloat(String(gift.amount)).toLocaleString('en-IN')}
                            </td>
                            {(onEdit || onDelete || onPrint) && (
                                <td style={{ textAlign: 'center' }}>
                                    {onEdit && (
                                        <button
                                            onClick={() => onEdit(gift)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: 'var(--primary)',
                                                cursor: 'pointer',
                                                fontSize: '0.9rem',
                                                marginRight: '8px',
                                                textDecoration: 'underline',
                                            }}
                                        >
                                            Edit
                                        </button>
                                    )}
                                    {onPrint && (
                                        <button
                                            onClick={() => onPrint(gift.id)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#4CAF50',
                                                cursor: 'pointer',
                                                fontSize: '0.9rem',
                                                marginRight: '8px',
                                                textDecoration: 'underline',
                                            }}
                                        >
                                            Print
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            onClick={() => {
                                                if (window.confirm('Delete this gift?')) {
                                                    onDelete(gift.id);
                                                }
                                            }}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#f44336',
                                                cursor: 'pointer',
                                                fontSize: '0.9rem',
                                                textDecoration: 'underline',
                                            }}
                                        >
                                            Delete
                                        </button>
                                    )}
                                </td>
                            )}
                        </tr>
                    ))}
                    <tr className="total-row">
                        <td colSpan={showTypist ? (onEdit || onDelete || onPrint ? 6 : 5) : (onEdit || onDelete || onPrint ? 5 : 4)} style={{ fontWeight: 700 }}>{t.gifts.totalGiftAmount}</td>
                        <td style={{ textAlign: 'right', fontSize: '1.1rem' }}>
                            ₹{totalAmount.toLocaleString('en-IN')}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
