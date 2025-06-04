import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/ui/use-toast';
import ReportsList from './ReportsList';
import CareerReport from './CareerReport';

interface Report {
  id: string;
  created_at: string;
  report_type: string;
  report_data: any;
}

const ReportsPage: React.FC = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // Query to fetch a single report when selected
  const { data: reportData, isLoading: isLoadingReport } = useQuery({
    queryKey: ['report', selectedReportId],
    queryFn: async () => {
      if (!selectedReportId || !session?.access_token) {
        return null;
      }
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reports/${selectedReportId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch report');
      }
      const data = await response.json();
      return data.data;
    },
    enabled: !!selectedReportId && !!session?.access_token,
    onSuccess: (data) => {
      if (data) {
        setSelectedReport(data);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error fetching report",
        description: error.message,
        variant: "destructive",
      });
      setSelectedReportId(null);
    }
  });

  const handleViewReport = (reportId: string) => {
    setSelectedReportId(reportId);
  };

  const handleCloseReport = () => {
    setSelectedReportId(null);
    setSelectedReport(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Your Career Reports</h1>
      
      {/* Reports List */}
      <div className="mb-8">
        <ReportsList onViewReport={handleViewReport} />
      </div>

      {/* Selected Report Modal */}
      {selectedReport && (
        <CareerReport 
          analysis={selectedReport.report_data}
          onClose={handleCloseReport}
        />
      )}
    </div>
  );
};

export default ReportsPage; 