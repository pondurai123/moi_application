import { useLanguage } from '../i18n/LanguageContext';

interface Gift {
    id: number;
    donorName: string;
    donorPlace: string;
    amount: number;
    receiptNumber?: string;
    typistName?: string;
}

interface Props {
    gifts: Gift[];
    totalAmount: number;
    showTypist?: boolean;
}

export default function GiftTable({ gifts, totalAmount, showTypist }: Props) {
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
                        </tr>
                    ))}
                    <tr className="total-row">
                        <td colSpan={showTypist ? 5 : 4} style={{ fontWeight: 700 }}>{t.gifts.totalGiftAmount}</td>
                        <td style={{ textAlign: 'right', fontSize: '1.1rem' }}>
                            ₹{totalAmount.toLocaleString('en-IN')}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
