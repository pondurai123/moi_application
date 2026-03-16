import { forwardRef } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

interface ReceiptData {
    gift: {
        receiptNumber: string;
        donorName: string;
        donorPlace: string;
        amount: number;
        denominations?: { denomination: number; quantity: number }[];
        typistName?: string;
        createdAt: string;
    };
    event: {
        groomName: string;
        brideName: string;
        location: string;
        phoneNumber?: string;
        functionNameEn?: string;
        functionNameTa?: string;
        weddingDate: string;
    };
    settings: {
        phone?: string;
        brandName?: string;
        brandContact?: string;
        receiptAdditionalText?: string;
        logoUrl?: string;
    };
}

interface Props {
    data: ReceiptData | null;
    hidden?: boolean;
}

const ReceiptPrint = forwardRef<HTMLDivElement, Props>(({ data, hidden = false }, ref) => {
    const { lang } = useLanguage();

    if (!data) return null;
    const { gift, event, settings } = data;

    const functionName = lang === 'ta'
        ? (event.functionNameTa || event.functionNameEn || 'நிகழ்வு')
        : (event.functionNameEn || 'Event');
    const phone = event.phoneNumber || settings.phone || '';
    const dateStr = new Date(gift.createdAt).toLocaleString('en-IN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
    });

    const labels = lang === 'ta' ? {
        title: 'மொய் ரசீது',
        event: 'நிகழ்வு',
        place: 'இடம்',
        phone: 'தொலைபேசி',
        date: 'நாள்',
        receiptNo: 'ரசீது',
        contributorDetails: 'பங்களிப்பாளர் விபரம்',
        contributor: 'பெயர்',
        placeLabel: 'ஊர்',
        contributionAmount: 'பங்களிப்பு தொகை',
        contributionDetails: 'பங்களிப்பு விபரம்',
        amountReceived: 'பெற்ற தொகை',
        totalContribution: 'மொத்த பங்களிப்பு',
        typist: 'தட்டச்சாளர்',
        thankYou: settings.receiptAdditionalText || 'தங்கள் வருகைக்கு நன்றி..',
        contactTitle: 'தொடர்பு கொள்ள',
    } : {
        title: 'Moi Receipt',
        event: 'Event',
        place: 'Place',
        phone: 'Phone',
        date: 'Date',
        receiptNo: 'Receipt',
        contributorDetails: 'Contributor Details',
        contributor: 'Contributor',
        placeLabel: 'Place',
        contributionAmount: 'Contribution Amount',
        contributionDetails: 'Contribution Details',
        amountReceived: 'Amount Received',
        totalContribution: 'Total Contribution',
        typist: 'Typist',
        thankYou: settings.receiptAdditionalText || 'Thank you for your visit..',
        contactTitle: 'Contact',
    };

    const receiptStyle: React.CSSProperties = {
        width: '80mm',
        maxWidth: '80mm',
        padding: '4mm',
        fontFamily: "'Courier New', monospace",
        fontSize: '11px',
        color: '#000',
        background: '#fff',
        lineHeight: 1.4,
        display: hidden ? 'none' : 'block',
        margin: 0,
        overflow: 'visible',
        boxSizing: 'border-box',
    };

    const dividerStyle: React.CSSProperties = {
        borderTop: '1px dashed #000',
        margin: '4px 0',
        padding: 0,
    };

    const boxedStyle: React.CSSProperties = {
        border: '1px solid #000',
        borderRadius: '0px',
        padding: '4px',
        marginBottom: '6px',
    };

    const centerBold: React.CSSProperties = {
        textAlign: 'center',
        fontWeight: 700,
    };

    return (
        <div ref={ref} className="receipt-print" style={receiptStyle}>
            {/* ===== HEADER ===== */}
            <div style={{ ...boxedStyle, textAlign: 'center', marginBottom: '10px' }}>
                {settings.logoUrl && (
                    <img src={settings.logoUrl} alt="Logo" style={{ maxWidth: '32mm', maxHeight: '14mm', marginBottom: '6px', objectFit: 'contain' }} />
                )}
                <div style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '0.5px', marginBottom: '8px' }}>
                    {labels.title}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700 }}>{event.groomName} & {event.brideName}</div>
                <div style={{ fontSize: '11px', marginTop: '4px' }}>{functionName}</div>
                <div style={{ fontSize: '10px', marginTop: '4px' }}>{event.location}</div>
                {phone && <div style={{ fontSize: '10px', marginTop: '2px' }}>{phone}</div>}
            </div>

            <div style={dividerStyle} />

            {/* ===== DATE & RECEIPT # ===== */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '10px', padding: '2px 0', gap: '8px' }}>
                <span>{labels.date}: {dateStr}</span>
                <span style={{ fontWeight: 800, fontSize: '13px', textAlign: 'right' }}>{labels.receiptNo}: #{gift.receiptNumber}</span>
            </div>

            <div style={dividerStyle} />

            {/* ===== CONTRIBUTOR SECTION ===== */}
            <div style={{ ...centerBold, fontSize: '12px', textDecoration: 'underline', marginBottom: '6px' }}>
                {labels.contributorDetails}
            </div>
            <div style={{ ...boxedStyle, marginBottom: '0' }}>
                <div style={{ fontSize: '11px', marginBottom: '2px' }}>{labels.contributor}: {gift.donorName}</div>
                <div style={{ fontSize: '11px', marginBottom: '4px' }}>{labels.placeLabel}: {gift.donorPlace}</div>
            </div>
            <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: 700, marginTop: '8px' }}>
                {labels.contributionAmount}: ₹{Number(gift.amount).toFixed(2)}
            </div>

            <div style={dividerStyle} />

            {/* ===== DENOMINATIONS ===== */}
            {gift.denominations && gift.denominations.length > 0 && (
                <>
                    <div style={{ ...centerBold, fontSize: '11px', textDecoration: 'underline', marginBottom: '6px' }}>
                        {labels.contributionDetails}
                    </div>
                    <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', marginBottom: '6px' }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left', paddingBottom: '4px', borderBottom: '1px solid #000' }}>₹</th>
                                <th style={{ textAlign: 'center', paddingBottom: '4px', borderBottom: '1px solid #000' }}>Qty</th>
                                <th style={{ textAlign: 'right', paddingBottom: '4px', borderBottom: '1px solid #000' }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {gift.denominations.map((d, i) => (
                                <tr key={i}>
                                    <td style={{ padding: '4px 0', textAlign: 'left', width: '30%', borderBottom: '1px dotted #777' }}>₹{d.denomination}</td>
                                    <td style={{ padding: '4px 0', textAlign: 'center', width: '20%', borderBottom: '1px dotted #777' }}>x {d.quantity}</td>
                                    <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 700, width: '50%', borderBottom: '1px dotted #777' }}>
                                        ₹{(d.denomination * d.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div style={{ fontWeight: 800, fontSize: '12px', textAlign: 'center', marginTop: '4px' }}>
                        {labels.amountReceived} : ₹{Number(gift.amount).toFixed(2)}
                    </div>
                    <div style={dividerStyle} />
                </>
            )}

            {/* ===== TOTAL ===== */}
            <div style={{ ...centerBold, fontSize: '13px', margin: '4px 0', border: '1.5px solid #000', borderRadius: '0px', padding: '6px 4px', background: '#fff' }}>
                {labels.totalContribution}: ₹{Number(gift.amount).toFixed(2)}
            </div>

            <div style={dividerStyle} />

            {/* ===== TYPIST ===== */}
            {gift.typistName && (
                <div style={{ textAlign: 'center', fontSize: '11px', marginBottom: '8px' }}>
                    {labels.typist} : {gift.typistName}
                </div>
            )}

            {/* ===== FOOTER ===== */}
            <div style={{ textAlign: 'center', fontSize: '15px', marginBottom: '6px' }}>🙏</div>
            <div style={{ textAlign: 'center', fontSize: '11px', fontStyle: 'italic', fontWeight: 600, marginBottom: '10px' }}>
                {labels.thankYou}
            </div>

            <div style={dividerStyle} />

            <div style={{ textAlign: 'center', fontSize: '10px', marginTop: '6px' }}>
                <div style={{ fontWeight: 800, textDecoration: 'underline', marginBottom: '4px' }}>
                    {labels.contactTitle}
                </div>
                {settings.brandName && <div style={{ fontWeight: 700, fontSize: '11px' }}>{settings.brandName}</div>}
                {settings.brandContact && <div style={{ marginTop: '2px' }}>{settings.brandContact}</div>}
            </div>
        </div>
    );
});

ReceiptPrint.displayName = 'ReceiptPrint';
export default ReceiptPrint;
