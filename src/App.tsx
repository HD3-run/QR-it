import { useState, useRef, useEffect } from 'react';
import { QRCodeWriter, BarcodeFormat, EncodeHintType } from '@zxing/library';
import './index.css';

export default function App() {
  const [text, setText] = useState('');
  const [qrSize, setQrSize] = useState<number>(300);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const previousQrImageUrl = useRef<string | null>(null);

  // Cleanup blob URLs
  useEffect(() => {
    return () => {
      if (previousQrImageUrl.current && previousQrImageUrl.current.startsWith('blob:')) {
        URL.revokeObjectURL(previousQrImageUrl.current);
      }
      if (qrImageUrl && qrImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(qrImageUrl);
      }
    };
  }, []);

  useEffect(() => {
    if (previousQrImageUrl.current && previousQrImageUrl.current !== qrImageUrl && previousQrImageUrl.current.startsWith('blob:')) {
      URL.revokeObjectURL(previousQrImageUrl.current);
    }
    previousQrImageUrl.current = qrImageUrl;
  }, [qrImageUrl]);

  const handleGenerate = async () => {
    if (!text) {
      setError('Please enter some text to generate a QR code');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const writer = new QRCodeWriter();
      const hints = new Map();
      hints.set(EncodeHintType.MARGIN as any, 1);

      // Generate QR matrix
      const matrix = writer.encode(text, BarcodeFormat.QR_CODE, qrSize, qrSize, hints as any);
      const width = matrix.getWidth();
      const height = matrix.getHeight();

      const scale = 1;
      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d')!;

      // Draw QR code
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#000000';

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (matrix.get(x, y)) {
            ctx.fillRect(x * scale, y * scale, scale, scale);
          }
        }
      }

      // Convert to blob
      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to create image blob'));
        }, 'image/png');
      });

      const blobUrl = URL.createObjectURL(blob);
      setQrImageUrl(blobUrl);
    } catch (err) {
      console.error(err);
      setError('Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (qrImageUrl) {
      const link = document.createElement('a');
      link.href = qrImageUrl;
      link.download = 'generated-qr-code.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>QR Code Generator</h1>
        <p style={{ color: '#666' }}>Generate QR codes for any text or URL</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Input Section */}
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Content (Text or URL)
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{ width: '100%', height: '100px', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
              placeholder="Enter text here..."
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Size: {qrSize}px
            </label>
            <input
              type="range"
              min="100"
              max="1000"
              step="50"
              value={qrSize}
              onChange={(e) => setQrSize(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !text}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: loading || !text ? '#ccc' : '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading || !text ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Generating...' : 'Generate QR Code'}
          </button>

          {error && (
            <div style={{ color: 'red', marginTop: '0.5rem', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}
        </div>

        {/* Output Section */}
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
          {qrImageUrl ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '1rem', border: '1px solid #eee', padding: '1rem', display: 'inline-block', borderRadius: '4px', background: '#fff' }}>
                 <img
                   src={qrImageUrl}
                   alt="Generated QR Code"
                   style={{ width: '200px', height: '200px', objectFit: 'contain' }}
                 />
              </div>

              <div>
                <button
                  onClick={handleDownload}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Download
                </button>
              </div>
            </div>
          ) : (
            <div style={{ color: '#999', textAlign: 'center' }}>
              <p>Enter text and click generate to see QR code</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}