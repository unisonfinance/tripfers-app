import React, { useState, useRef } from 'react';
import { mockBackend } from '../../services/mockBackend';
import { User, DocumentType, DriverDocument } from '../../types';
import { Icons } from '../Icons';

interface DocumentsViewProps {
  currentUser: User;
  onBack: () => void;
}

const DOC_TYPES: { type: DocumentType; label: string; description?: string }[] = [
  { 
    type: 'LICENSE_SELFIE', 
    label: "Selfie with your driver's license",
    description: "Take a photo of yourself holding your driver's license"
  },
  { 
    type: 'VRC', 
    label: "Vehicle Registration Certificate",
    description: "Official registration document for your vehicle"
  },
  { 
    type: 'VRC_PHOTO', 
    label: "Vehicle photo with VRC certificate",
    description: "Photo of vehicle with license plate visible and VRC"
  },
  { 
    type: 'INSURANCE', 
    label: "Insurance",
    description: "Valid commercial vehicle insurance policy"
  },
  { 
    type: 'TRANSPORT_LICENSE', 
    label: "Transportation license",
    description: "According to law and regulations in your country"
  }
];

export const DocumentsView: React.FC<DocumentsViewProps> = ({ currentUser, onBack }) => {
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const getDocStatus = (type: DocumentType) => {
    return currentUser.documents?.find(d => d.type === type);
  };

  const handleFileSelect = async (type: DocumentType, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploading(type);
      
      try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        await mockBackend.uploadDocument(currentUser.id, type, file);
      } catch (error) {
        console.error("Upload failed", error);
      } finally {
        setUploading(null);
      }
    }
  };

  const triggerFileInput = (type: DocumentType) => {
    if (fileInputRefs.current[type]) {
      fileInputRefs.current[type]?.click();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white px-4 py-4 shadow-sm border-b border-slate-200 sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <Icons.ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h2 className="text-lg font-bold text-slate-800">Documents</h2>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        
        {/* Warning Banner */}
        <div className="bg-red-400 text-white p-4 rounded-xl mb-6 shadow-sm">
            <p className="text-sm font-medium text-center">
                To upload new documents please ensure they are clear and legible.
                <br />
                Approvals are handled manually by our team.
            </p>
        </div>

        <div className="space-y-4">
          {DOC_TYPES.map((docInfo) => {
            const currentDoc = getDocStatus(docInfo.type);
            const isApproved = currentDoc?.status === 'APPROVED';
            const isPending = currentDoc?.status === 'PENDING';
            const isRejected = currentDoc?.status === 'REJECTED';

            return (
              <div key={docInfo.type} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 flex items-center gap-4">
                    {/* Status Icon / Upload Button */}
                    <div className="flex-shrink-0">
                        {isApproved ? (
                            <button 
                                onClick={() => triggerFileInput(docInfo.type)}
                                disabled={!!uploading}
                                className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 hover:bg-green-200 transition-colors"
                            >
                                <Icons.UploadCloud className="w-5 h-5" />
                            </button>
                        ) : isPending ? (
                            <button 
                                onClick={() => triggerFileInput(docInfo.type)}
                                disabled={!!uploading}
                                className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 hover:bg-yellow-200 transition-colors animate-pulse"
                            >
                                <Icons.UploadCloud className="w-5 h-5" />
                            </button>
                        ) : (
                            <button 
                                onClick={() => triggerFileInput(docInfo.type)}
                                disabled={!!uploading}
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md transition-transform active:scale-95 ${isRejected ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                            >
                                {uploading === docInfo.type ? (
                                    <Icons.Loader className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Icons.UploadCloud className="w-5 h-5" />
                                )}
                            </button>
                        )}
                    </div>

                    {/* Text Info */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-slate-800 leading-tight mb-1">
                            {docInfo.label}
                        </h3>
                        {isRejected ? (
                            <p className="text-xs text-red-500 font-medium">
                                Rejected: {currentDoc.rejectionReason || 'Please re-upload'}
                            </p>
                        ) : isPending ? (
                            <p className="text-xs text-yellow-600 font-medium">Verifying...</p>
                        ) : isApproved ? (
                            <p className="text-xs text-green-600 font-medium">Approved</p>
                        ) : (
                            <p className="text-xs text-slate-400 truncate">{docInfo.description}</p>
                        )}
                    </div>

                    {/* Document Preview (if exists) */}
                    {currentDoc && (
                        <a 
                            href={currentDoc.url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-blue-500 transition-colors"
                        >
                            <Icons.Paperclip className="w-4 h-4" />
                        </a>
                    )}
                </div>

                {/* Hidden File Input */}
                <input
                    type="file"
                    ref={el => fileInputRefs.current[docInfo.type] = el}
                    onChange={(e) => handleFileSelect(docInfo.type, e)}
                    className="hidden"
                    accept="image/*,.pdf"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
