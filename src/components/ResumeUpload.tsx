import React, { useState, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Upload, FileText, X, CheckCircle2, Trash2, RefreshCw, Download } from 'lucide-react';

interface ResumeInfo {
  id: string;
  filename: string;
  uploadedAt: string;
  fileData: string;
  fileType: string;
  resumeUrl: string;
}

interface ResumeUploadProps {
  onUploadSuccess?: (resume: ResumeInfo) => void;
  existingResume?: ResumeInfo | null;
  onRemoveResume?: () => void;
}

const ResumeUpload: React.FC<ResumeUploadProps> = ({ 
  onUploadSuccess, 
  existingResume,
  onRemoveResume 
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showUploadZone, setShowUploadZone] = useState(false);
  const { user, session } = useAuth();
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 5MB.",
        variant: "destructive",
      });
      return false;
    }
    if (!['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or DOCX file.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleFileSelect = (file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    if (!user || !session?.access_token) {
      toast({
        title: "Authentication Error",
        description: "User not logged in or session expired.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('resume', selectedFile);

      const response = await fetch(`/api/resume/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload resume');
      }

      const data = await response.json();
      const resumeInfo: ResumeInfo = {
        id: data.resume.id,
        filename: data.resume.file_name,
        uploadedAt: data.resume.created_at,
        fileData: data.resume.file_data,
        fileType: data.resume.file_type,
        resumeUrl: data.resume.resume_url
      };

      if (onUploadSuccess) {
        onUploadSuccess(resumeInfo);
      }

      setShowUploadZone(false);
      setSelectedFile(null);
      toast({
        title: "Upload Successful",
        description: "Your resume has been updated successfully.",
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadResume = async () => {
    if (!existingResume?.resumeUrl) return;

    try {
      // If we have a direct URL to the resume, use it
      window.open(existingResume.resumeUrl, '_blank');
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Error",
        description: "Failed to download resume. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveResume = () => {
    if (onRemoveResume) {
      onRemoveResume();
      toast({
        title: "Resume Removed",
        description: "Your resume has been removed successfully.",
      });
    }
  };

  const UploadZone = () => (
    <div
      className={`relative border-2 border-dashed rounded-lg p-4 transition-colors ${
        isDragging 
          ? 'border-purple-500 bg-purple-50' 
          : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept=".pdf,.docx"
        onChange={handleFileChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <div className="flex flex-col items-center justify-center text-center py-4">
        <Upload className="w-8 h-8 text-gray-400 mb-2" />
        <p className="text-xs font-medium text-gray-600">
          Drag and drop your resume here, or click to browse
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Supports PDF only
        </p>
      </div>
    </div>
  );

  if (existingResume && !showUploadZone) {
    return (
      <div className="space-y-3">
        <div className="flex flex-col bg-purple-50 rounded-lg p-3 group relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <FileText className="w-5 h-5 text-purple-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">
                  {existingResume.filename}
                </p>
                <p className="text-xs text-gray-500">
                  Uploaded {new Date(existingResume.uploadedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveResume}
                className="h-7 w-7 p-0 hover:bg-red-100 group-hover:opacity-100 opacity-0 transition-opacity"
              >
                <X className="h-3.5 w-3.5 text-red-600" />
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUploadZone(true)}
              className="h-7 px-2 text-purple-600 hover:bg-purple-100 border-purple-200"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Replace
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={handleDownloadResume}
                className="h-7 w-7 p-0 hover:bg-purple-100"
              >
                <Download className="h-3.5 w-3.5 text-purple-600" />
              </Button>
          </div>
        </div>
        {showUploadZone && (
          <div className="mt-2 space-y-2">
            <div className="flex items-center justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUploadZone(false)}
                className="h-7 w-7 p-0 hover:bg-gray-100"
              >
                <X className="h-3.5 w-3.5 text-gray-500" />
              </Button>
            </div>
            <UploadZone />
            {selectedFile && (
              <div className="flex justify-end">
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="h-7 px-3 bg-purple-600 hover:bg-purple-700 text-white text-xs"
                >
                  {isUploading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-1.5" />
                      Uploading...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Replace Resume
                    </div>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      {!selectedFile ? (
        <UploadZone />
      ) : (
        <div className="space-y-2">
          <div className="flex flex-col bg-purple-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-purple-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFile(null)}
                className="h-7 w-7 p-0 hover:bg-purple-100"
              >
                <X className="h-3.5 w-3.5 text-gray-500" />
              </Button>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="h-7 px-3 bg-purple-600 hover:bg-purple-700 text-white text-xs"
              >
                {isUploading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-1.5" />
                    Uploading...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Upload
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeUpload; 