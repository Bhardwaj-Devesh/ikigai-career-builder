import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/ui/use-toast';

interface Report {
  id: string;
  created_at: string;
  report_type: string;
  report_data: any;
  ikigai_responses?: any;
}

interface ReportsListProps {
  onViewReport: (reportId: string) => void;
}

const ReportsList: React.FC<ReportsListProps> = ({ onViewReport }) => {
  const { user, session } = useAuth();
  const { toast } = useToast();

  // Fetch reports for the logged-in user
  const { data: reports, isLoading, error } = useQuery<Report[]>({
    queryKey: ['userReports', user?.id],
    queryFn: async () => {
      if (!user?.id || !session?.access_token) {
        return [];
      }
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reports/user/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch reports');
      }
      const data = await response.json();
      return data.data || [];
    },
    enabled: !!user?.id && !!session?.access_token,
    retry: 1,
  });

  // Use useEffect to show toast when error changes
  useEffect(() => {
    if (error) {
      toast({
        title: "Error fetching reports",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const getReportTitle = (report: Report) => {
    if (report.report_data?.careerRecommendations?.[0]?.title) {
      return report.report_data.careerRecommendations[0].title;
    }
    return 'Career Development Report';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return <div className="text-center text-gray-500">Loading reports...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Could not load reports.</div>;
  }

  if (!reports || reports.length === 0) {
    return <div className="text-center text-gray-500">No reports found. Upload your resume to get started!</div>;
  }

  return (
    <ul className="space-y-2">
      {reports.map((report) => (
        <li
          key={report.id}
          className="p-3 bg-white rounded-md shadow-sm border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => onViewReport(report.id)}
        >
          <div className="space-y-1">
            <h4 className="font-semibold text-gray-800 text-sm">
              {getReportTitle(report)}
            </h4>
            
          </div>
        </li>
      ))}
    </ul>
  );
};

export default ReportsList; 