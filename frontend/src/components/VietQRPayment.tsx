import { useState, useEffect } from 'react';
import Button from './Button';

interface VietQRPaymentProps {
  amount: number;
  orderInfo: string;
  onClose: () => void;
  onSuccess: (image?: File) => void;
}

export default function VietQRPayment({ 
  amount, 
  orderInfo, 
  onClose,
  onSuccess 
}: VietQRPaymentProps) {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // Bank account info - Replace with your actual bank details
  const bankInfo = {
    bankId: '970422', // MB Bank code
    accountNo: '6668668866666',
    accountName: 'Trần Văn Huynh',
    template: 'compact2'
  };

  useEffect(() => {
    // Generate VietQR URL
    const description = encodeURIComponent(orderInfo);
    const url = `https://img.vietqr.io/image/${bankInfo.bankId}-${bankInfo.accountNo}-${bankInfo.template}.png?amount=${amount}&addInfo=${description}&accountName=${encodeURIComponent(bankInfo.accountName)}`;
    setQrUrl(url);
  }, [amount, orderInfo]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file hình ảnh');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Kích thước file không được vượt quá 5MB');
        return;
      }
      setUploadedImage(file);
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleConfirmTransfer = () => {
    setShowUpload(true);
  };

  const handleSubmitProof = () => {
    if (!uploadedImage) {
      alert('Vui lòng tải lên hình ảnh chuyển khoản');
      return;
    }
    // Pass the image to parent component
    onSuccess(uploadedImage);
  };

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[95vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Chuyển khoản ngân hàng</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* QR Code */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-4 mb-4 sm:mb-6">
            <div className="text-center mb-3">
              <p className="text-sm text-gray-600 mb-2">Quét mã QR để thanh toán</p>
              {qrUrl && (
                <img 
                  src={qrUrl} 
                  alt="VietQR Code" 
                  className="w-full max-w-[280px] mx-auto rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="280" height="280"%3E%3Crect fill="%23f3f4f6" width="280" height="280"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af"%3EQR Code%3C/text%3E%3C/svg%3E';
                  }}
                />
              )}
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Sử dụng app ngân hàng để quét mã QR
              </p>
            </div>
          </div>

          {/* Bank Details */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Ngân hàng:</span>
              <span className="font-semibold text-sm">MB Bank</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Số tài khoản:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-sm">{bankInfo.accountNo}</span>
                <button
                  onClick={() => copyToClipboard(bankInfo.accountNo)}
                  className="text-brand-500 hover:text-brand-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Chủ tài khoản:</span>
              <span className="font-semibold text-sm">{bankInfo.accountName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Số tiền:</span>
              <span className="font-bold text-brand-500 text-base">{amount.toLocaleString()}₫</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm text-gray-600">Nội dung:</span>
              <div className="flex items-center gap-2 max-w-[60%]">
                <span className="font-mono text-xs text-right break-all">{orderInfo}</span>
                <button
                  onClick={() => copyToClipboard(orderInfo)}
                  className="text-brand-500 hover:text-brand-600 flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {copied && (
            <div className="bg-green-100 text-green-700 text-sm px-4 py-2 rounded-lg mb-4 text-center">
              ✓ Đã sao chép!
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <h3 className="font-semibold text-sm text-blue-900 mb-2">Hướng dẫn thanh toán:</h3>
            <ol className="text-xs sm:text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Mở app ngân hàng và quét mã QR</li>
              <li>Kiểm tra thông tin chuyển khoản</li>
              <li>Xác nhận thanh toán</li>
              <li>Chụp ảnh hoặc lưu biên lai</li>
            </ol>
          </div>

          {/* Upload Section */}
          {showUpload && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-sm text-yellow-900 mb-3">Tải lên hình ảnh chuyển khoản</h3>
              
              {/* File Input */}
              <div className="mb-3">
                <label className="block">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-brand-500 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-gray-600">
                      {uploadedImage ? uploadedImage.name : 'Nhấn để chọn hình ảnh'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, JPEG (Tối đa 5MB)
                    </p>
                  </div>
                </label>
              </div>

              {/* Image Preview */}
              {previewUrl && (
                <div className="mb-3">
                  <p className="text-sm text-gray-600 mb-2">Xem trước:</p>
                  <div className="relative rounded-lg overflow-hidden border border-gray-200">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-full h-auto max-h-64 object-contain bg-gray-50"
                    />
                    <button
                      onClick={() => {
                        setUploadedImage(null);
                        setPreviewUrl('');
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              <Button
                onClick={handleSubmitProof}
                disabled={!uploadedImage}
                className="w-full bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Xác nhận và hoàn tất
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          {!showUpload && (
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button
                onClick={handleConfirmTransfer}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
              >
                Đã chuyển khoản
              </Button>
            </div>
          )}

          <p className="text-xs text-gray-500 text-center mt-4">
            Đơn hàng sẽ được xử lý sau khi chúng tôi xác nhận thanh toán
          </p>
        </div>
      </div>
    </div>
  );
}
