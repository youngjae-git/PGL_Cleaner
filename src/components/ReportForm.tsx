// 파일 경로: src/components/ReportForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { storage, db } from '@/lib/firebase-client';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from "firebase/firestore";

// --- Helper Components & Icons ---
function ClientOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => { setHasMounted(true); }, []);
  if (!hasMounted) return fallback;
  return <>{children}</>;
}
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>;
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;
const RemoveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;

// --- Main Component ---
interface ReportFormProps {
    task: any;
    uid: string;
    taskId: string;
}
type ReportType = 'issue' | 'finish' | null;

export default function ReportForm({ task, uid, taskId }: ReportFormProps) {
  const [reportType, setReportType] = useState<ReportType>(null);
  const [comment, setComment] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [generatedFileNames, setGeneratedFileNames] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [previewModal, setPreviewModal] = useState<{ show: boolean; file: File | null; index: number }>({ show: false, file: null, index: 0 });

  const generateFileName = (type: 'issue' | 'finish', file: File, index: number) => {
    const fileDate = new Date(file.lastModified);
    const dateStr = fileDate.getFullYear().toString().slice(2) +
                  ('0' + (fileDate.getMonth() + 1)).slice(-2) +
                  ('0' + fileDate.getDate()).slice(-2) + '_' +
                  ('0' + fileDate.getHours()).slice(-2) +
                  ('0' + fileDate.getMinutes()).slice(-2) +
                  ('0' + fileDate.getSeconds()).slice(-2);

    const sanitizeName = (name: string | undefined) => 
      (name || 'Unknown').replace(/[^a-zA-Z0-9가-힣\s]/g, '').replace(/\s+/g, '_').trim();

    const propertyName = sanitizeName(task.property_name);
    const cleanerName = sanitizeName(task.cleaner_name);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    
    return `${dateStr}_${type}_${cleanerName}_${propertyName}_${index}.${fileExtension}`;
  };

  useEffect(() => {
    if (reportType && files.length > 0) {
      const newFileNames = files.map((file, index) => 
        generateFileName(reportType, file, index)
      );
      setGeneratedFileNames(newFileNames);
    }
  }, [files, reportType]);

  const handleBack = () => {
    setReportType(null);
    setComment('');
    setFiles([]);
    setGeneratedFileNames([]);
    setStatusMessage('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setGeneratedFileNames(prev => prev.filter((_, i) => i !== index));
  };

  const removeAllFiles = () => {
    setFiles([]);
    setGeneratedFileNames([]);
  };

  const openPreview = (file: File, index: number) => setPreviewModal({ show: true, file, index });
  const closePreview = () => setPreviewModal({ show: false, file: null, index: 0 });

  const prevPreview = () => {
    if (previewModal.index > 0) {
      setPreviewModal(prev => ({ ...prev, index: prev.index - 1, file: files[prev.index - 1] }));
    }
  };

  const nextPreview = () => {
    if (previewModal.index < files.length - 1) {
      setPreviewModal(prev => ({ ...prev, index: prev.index + 1, file: files[prev.index + 1] }));
    }
  };

  const handleSubmit = async () => {
    if (!reportType) return;
    if (files.length === 0 && comment.trim() === '') {
        setStatusMessage('Please add a photo or enter a message.');
        return;
    }

    setUploading(true);
    setStatusMessage('Uploading...');

    try {
        if (!storage || !db) throw new Error('Firebase is not initialized.');

        const isIssueReport = reportType === 'issue';
        let uploadedUrls: string[] = [];

        if (files.length > 0) {
            setStatusMessage(`Uploading ${files.length} photos...`);
            const uploadPromises = files.map(async (file, index) => {
                const newFileName = generatedFileNames[index] || generateFileName(isIssueReport ? 'issue' : 'finish', file, index);
                
                // --- 여기가 최종 수정된 부분입니다: 파일 경로 ---
                // users/{uid} 폴더 바로 아래에 저장합니다.
                const filePath = `users/${uid}/${newFileName}`;
                // ---------------------------------------------
                
                const fileRef = ref(storage, filePath);
                await uploadBytes(fileRef, file);
                return await getDownloadURL(fileRef);
            });
            uploadedUrls = await Promise.all(uploadPromises);
            setStatusMessage(`All files uploaded! (${uploadedUrls.length} files)`);
        }
      
        const dataToUpdate: { [key: string]: any } = {};
        const messageField = isIssueReport ? 'report.issue_message' : 'report.after_message';
        const pictureField = isIssueReport ? 'report.issue_picture_url' : 'report.after_picture_url';

        if (comment.trim()) {
            dataToUpdate[messageField] = comment;
        }
        if (uploadedUrls.length > 0) {
            dataToUpdate[pictureField] = uploadedUrls;
        }

        if (Object.keys(dataToUpdate).length > 0) {
            setStatusMessage('Saving report...');
            const taskRef = doc(db, "users", uid, "tasks", taskId);
            await updateDoc(taskRef, dataToUpdate);
        }
      
        setStatusMessage('Report submitted successfully!');
        setTimeout(() => {
            setComment('');
            setFiles([]);
            setGeneratedFileNames([]);
            setReportType(null);
            setStatusMessage('');
        }, 2000);

    } catch (err: any) {
        setStatusMessage(`Error: ${err.message}. Please try again later.`);
    } finally {
        setUploading(false);
    }
  };

  return (
    <ClientOnly fallback={<div className="p-4 text-center">Loading...</div>}>
      <div className="bg-gray-50 min-h-screen font-sans">
        <div className="p-4 max-w-lg mx-auto bg-white shadow-lg rounded-b-xl">
          
          {reportType && (
            <div suppressHydrationWarning={true}>
              <button onClick={handleBack} className="flex items-center gap-1 text-gray-600 hover:text-black mb-4 transition-colors">
                <BackIcon /> Back
              </button>
              <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
                {reportType === 'issue' ? 'Report Cleaning Issue' : 'Report Cleaning Completion'}
              </h2>
              
              <div className="space-y-4">
                <button 
                  onClick={() => document.getElementById('gallery-input')?.click()}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition-all transform hover:scale-105"
                >
                  <UploadIcon /> Select Photos/Videos
                </button>
                <input id="gallery-input" type="file" accept="image/*,video/*" multiple onChange={handleFileChange} className="hidden" />
              
                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-700">{files.length} files selected</span>
                      <button onClick={removeAllFiles} className="text-red-500 hover:text-red-700 font-semibold">Remove All</button>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-2 max-h-56 overflow-y-auto space-y-2 bg-white">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center gap-3 p-1">
                          <img src={URL.createObjectURL(file)} alt={file.name} className="w-12 h-12 object-cover rounded-md cursor-pointer flex-shrink-0" onClick={() => openPreview(file, index)} />
                          <div className="flex-1 overflow-hidden">
                            <p className="text-xs text-gray-500 truncate">{generatedFileNames[index] || file.name}</p>
                            <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                          <button onClick={() => removeFile(index)} className="p-1 text-gray-400 hover:text-red-500"><RemoveIcon /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <textarea 
                rows={5} 
                value={comment} 
                onChange={(e) => setComment(e.target.value)} 
                placeholder="Enter a message (optional)" 
                className="w-full mt-4 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition" 
              />
              
              <button 
                onClick={handleSubmit} 
                disabled={uploading} 
                className={`w-full mt-4 p-4 text-lg font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg disabled:cursor-not-allowed disabled:scale-100 ${uploading ? 'bg-gray-500 text-white' : (reportType === 'issue' ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white' : 'bg-gradient-to-r from-green-500 to-teal-500 text-white')}`}
              >
                {uploading ? 'Submitting...' : 'Submit Report'}
              </button>
              
              {statusMessage && (
                <div className={`mt-4 p-3 rounded-lg text-center text-sm ${statusMessage.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {statusMessage}
                </div>
              )}
            </div>
          )}

          {!reportType && (
            <div className="text-center" suppressHydrationWarning={true}>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Cleaning Management</h2>
              <p className="text-gray-500 mb-6">Please check the task and start reporting.</p>
              <div className="bg-gray-100 p-4 rounded-lg mb-8 text-left text-sm space-y-2">
                <p><strong>Property Name:</strong> <span className="text-gray-600 font-medium">{task.property_name || 'Loading...'}</span></p>
                <p><strong>Cleaner Name:</strong> <span className="text-gray-600 font-medium">{task.cleaner_name || 'Loading...'}</span></p>
              </div>
              <div className="grid gap-4">
                <button onClick={() => setReportType('issue')} className="w-full py-4 px-4 bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold rounded-lg shadow-md hover:scale-105 transition-transform">Report Cleaning Issue</button>
                <button onClick={() => setReportType('finish')} className="w-full py-4 px-4 bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold rounded-lg shadow-md hover:scale-105 transition-transform">Report Cleaning Completion</button>
              </div>
            </div>
          )}

          {previewModal.show && (
            <div onClick={closePreview} className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div onClick={(e) => e.stopPropagation()} className="relative bg-white rounded-lg shadow-2xl">
                <button onClick={closePreview} className="absolute -top-4 -right-4 text-white bg-gray-800 rounded-full p-1"><CloseIcon /></button>
                <img src={URL.createObjectURL(previewModal.file!)} alt="preview" className="max-h-[80vh] max-w-[90vw] rounded-lg" />
                <div className="flex justify-between items-center p-2 bg-white rounded-b-lg">
                  <button onClick={prevPreview} disabled={previewModal.index === 0} className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50">Previous</button>
                  <span className="text-sm font-semibold">{previewModal.index + 1} / {files.length}</span>
                  <button onClick={nextPreview} disabled={previewModal.index === files.length - 1} className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50">Next</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </ClientOnly>
  );
}
