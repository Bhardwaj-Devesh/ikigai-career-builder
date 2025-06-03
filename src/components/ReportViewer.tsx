import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/components/AuthProvider';
import CareerReport from './CareerReport';

interface ReportViewerProps {
  reportId: string;
  onClose: () => void;
}

const ReportViewer: React.FC<ReportViewerProps> = ({ reportId, onClose }) => {
  const { toast } = useToast();
  const { session } = useAuth();

  // Fetch the specific report data
  const { data: report, isLoading, error } = useQuery({
    queryKey: ['report', reportId],
    queryFn: async () => {
      if (!session?.access_token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/reports/report/${reportId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch report');
      }

      const data = await response.json();
      if (!data.success || !data.data?.report_data) {
        throw new Error('Invalid report data received');
      }

      return data.data;
    },
    enabled: !!reportId && !!session?.access_token,
    retry: 1,
  });

  // Use useEffect to show toast when error changes
  useEffect(() => {
    if (error) {
      toast({
        title: "Error fetching report",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-red-500">
          {error ? error.message : 'Report not found'}
        </div>
      </div>
    );
  }

  return (
    <CareerReport 
      analysis={report.report_data}
      onClose={onClose}
      showSaveButton={false}
    />
  );
};

export default ReportViewer; 