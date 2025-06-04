import React, { useState, useEffect } from 'react';
import ResumeUpload from './ResumeUpload';
import ReportsList from './ReportsList';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface SidebarProps {
  onViewReport: (reportId: string) => void;
  onContinueChat: () => void;
  currentView: 'chat' | 'report' | null;
}

interface ResumeInfo {
  id: string;
  filename: string;
  uploadedAt: string;
  fileData: string;
  fileType: string;
  resumeUrl: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onViewReport, onContinueChat, currentView }) => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [resumeInfo, setResumeInfo] = useState<ResumeInfo | null>(null);
  const [isLoadingResume, setIsLoadingResume] = useState(false);

  // Fetch resume from backend when component mounts
  useEffect(() => {
    const fetchResumeFromBackend = async () => {
      if (!user?.id || !session?.access_token) return;
      
      setIsLoadingResume(true);
      try {
        const response = await fetch(`/api/resume/user-resume/${user.id}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            // No resume found, which is fine
            setResumeInfo(null);
            return;
          }
          throw new Error('Failed to fetch resume');
        }

        const data = await response.json();
        if (data.resume) {
          // Convert the resume data to our frontend format
          const resumeInfo: ResumeInfo = {
            id: data.resume.id,
            filename: data.resume.file_name,
            uploadedAt: data.resume.created_at,
            fileData: data.resume.file_data, // Base64 data from backend
            fileType: data.resume.file_type,
            resumeUrl: data.resume.resume_url
          };
          setResumeInfo(resumeInfo);
        }
      } catch (error) {
        console.error('Error fetching resume:', error);
        toast({
          title: "Error loading resume",
          description: "Failed to load your resume from the server.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingResume(false);
      }
    };

    fetchResumeFromBackend();
  }, [user?.id, session?.access_token, toast]);

  const handleRemoveResume = async () => {
    if (!user?.id || !session?.access_token || !resumeInfo?.id) return;

    try {
      const response = await fetch(`/api/resume/${resumeInfo.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete resume');
      }

      setResumeInfo(null);
      toast({
        title: "Resume Removed",
        description: "Your resume has been removed successfully.",
      });
    } catch (error) {
      console.error('Error removing resume:', error);
      toast({
        title: "Error",
        description: "Failed to remove resume. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadResume = () => {
    if (!resumeInfo?.fileData) return;

    try {
      // Convert base64 to blob
      const byteString = atob(resumeInfo.fileData.split(',')[1]);
      const mimeString = resumeInfo.fileData.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      
      const blob = new Blob([ab], { type: mimeString });
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = resumeInfo.filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      toast({
        title: "Download Started",
        description: "Your resume download has started.",
      });
    } catch (error) {
      console.error('Error downloading resume:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download resume. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleResumeUploadSuccess = (resume: ResumeInfo) => {
    setResumeInfo(resume);
    toast({
      title: "Resume Updated",
      description: "Your resume has been successfully updated.",
    });
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Sidebar Header */}
      <h2 className="text-lg font-bold mb-4 text-gray-800">Career Tools</h2>

      {/* Resume Upload Section */}
      <div className="mb-6 p-4 bg-white/70 rounded-lg shadow-sm border border-white/30">
        <h3 className="font-semibold mb-2 text-gray-700">Your Resume</h3>
        
        {isLoadingResume ? (
          <div className="text-center text-gray-500 py-2">Loading resume info...</div>
        ) : (
          <ResumeUpload 
            onUploadSuccess={handleResumeUploadSuccess}
            existingResume={resumeInfo}
            onRemoveResume={handleRemoveResume}
          />
        )}
      </div>

      {/* Reports List Section */}
      <div className="flex-grow p-4 bg-white/70 rounded-lg shadow-sm border border-white/30 overflow-y-auto">
        <h3 className="font-semibold mb-3 text-gray-700">Your Career Reports</h3>
        <p className="text-sm text-gray-500 mb-4">View and manage your career analysis reports</p>
        <ReportsList onViewReport={onViewReport} />
      </div>

      {/* Continue Chat Button */}
      {currentView === 'report' && (
        <button
          onClick={onContinueChat}
          className="mt-4 w-full py-2 px-4 bg-purple-600 text-white font-semibold rounded-lg shadow hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
        >
          Continue Chat
        </button>
      )}
    </div>
  );
};

export default Sidebar; 