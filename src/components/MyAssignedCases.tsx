import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileText, Clock, AlertCircle, Play } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AssignedCase {
  id: string;
  case_number: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  progress: number;
}

export const MyAssignedCases = () => {
  const [cases, setCases] = useState<AssignedCase[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchAssignedCases();
    }
  }, [user]);

  const fetchAssignedCases = async () => {
    try {
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .or(`assigned_to.eq.${user?.id},analyst_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Mock progress data (in real app, this would be calculated from case activities)
      const casesWithProgress = data?.map(caseItem => ({
        ...caseItem,
        progress: Math.floor(Math.random() * 100)
      })) || [];

      setCases(casesWithProgress);
    } catch (error) {
      console.error('Error fetching assigned cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'in_progress': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Assigned Cases</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading your cases...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            My Assigned Cases
          </CardTitle>
          <CardDescription>Cases currently assigned to you for analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{cases.length}</div>
              <div className="text-sm text-muted-foreground">Total Assigned</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {cases.filter(c => c.status === 'in_progress').length}
              </div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {cases.filter(c => c.priority === 'high').length}
              </div>
              <div className="text-sm text-muted-foreground">High Priority</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {cases.map((caseItem) => (
          <Card key={caseItem.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{caseItem.case_number}</CardTitle>
                  <CardDescription>{caseItem.title}</CardDescription>
                </div>
                <Badge className={getPriorityColor(caseItem.priority)}>
                  {caseItem.priority}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge className={getStatusColor(caseItem.status)}>
                  {caseItem.status.replace('_', ' ')}
                </Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {new Date(caseItem.created_at).toLocaleDateString()}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Analysis Progress</span>
                  <span>{caseItem.progress}%</span>
                </div>
                <Progress value={caseItem.progress} className="h-2" />
              </div>

              <div className="flex gap-2 pt-2">
                <Button size="sm" className="flex-1">
                  <Play className="h-3 w-3 mr-1" />
                  Continue Analysis
                </Button>
                <Button size="sm" variant="outline">
                  <FileText className="h-3 w-3 mr-1" />
                  Report
                </Button>
              </div>

              {caseItem.priority === 'high' && (
                <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-md">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-700 dark:text-red-300">
                    High priority - Requires immediate attention
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {cases.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Cases Assigned</h3>
            <p className="text-muted-foreground">You don't have any cases assigned at the moment.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};