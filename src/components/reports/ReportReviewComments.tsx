import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Clock,
  User
} from "lucide-react";

interface Comment {
  id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  content: string;
  created_at: string;
  type: "comment" | "approval" | "rejection" | "revision_request";
}

interface ReportReviewCommentsProps {
  comments: Comment[];
  onAddComment: (content: string) => Promise<void>;
  isLoading?: boolean;
}

export const ReportReviewComments = ({ 
  comments, 
  onAddComment, 
  isLoading = false 
}: ReportReviewCommentsProps) => {
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onAddComment(newComment.trim());
      setNewComment("");
    } finally {
      setSubmitting(false);
    }
  };

  const getCommentIcon = (type: string) => {
    switch (type) {
      case "approval":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "rejection":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "revision_request":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default:
        return <MessageSquare className="h-4 w-4 text-blue-600" />;
    }
  };

  const getCommentBadge = (type: string) => {
    switch (type) {
      case "approval":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">Approved</Badge>;
      case "rejection":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs">Rejected</Badge>;
      case "revision_request":
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 text-xs">Revision Requested</Badge>;
      default:
        return null;
    }
  };

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      officer_commanding_unit: "OCU",
      commanding_officer: "CO",
      chief_of_cyber: "Chief of Cyber",
      administrator: "Admin",
      supervisor: "Supervisor",
      analyst: "Analyst",
      forensic_analyst: "Forensic Analyst",
      exhibit_officer: "Exhibit Officer",
    };
    return roleLabels[role] || role;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5" />
          Review Comments & Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-[300px] pr-4">
          {comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
              <MessageSquare className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm">No comments yet</p>
              <p className="text-xs">Be the first to add a review comment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment, index) => (
                <div key={comment.id}>
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-primary/10">
                        {comment.user_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{comment.user_name}</span>
                        <Badge variant="outline" className="text-xs px-1.5 py-0">
                          {getRoleLabel(comment.user_role)}
                        </Badge>
                        {getCommentBadge(comment.type)}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(new Date(comment.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </div>
                      <div className="mt-2 p-3 rounded-lg bg-muted/50 text-sm">
                        <div className="flex items-start gap-2">
                          {getCommentIcon(comment.type)}
                          <p className="leading-relaxed">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {index < comments.length - 1 && <Separator className="my-4" />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <Separator />

        <div className="space-y-3">
          <Textarea
            placeholder="Add a review comment, feedback, or note..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            className="resize-none"
            disabled={isLoading || submitting}
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={!newComment.trim() || submitting || isLoading}
              size="sm"
            >
              <Send className="h-4 w-4 mr-2" />
              {submitting ? "Sending..." : "Add Comment"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
