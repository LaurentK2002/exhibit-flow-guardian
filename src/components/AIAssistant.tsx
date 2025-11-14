import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Brain, Search, FileText, Lightbulb, MessageSquare, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const AIAssistant = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [analysisInput, setAnalysisInput] = useState("");
  const [analysisResult, setAnalysisResult] = useState("");

  const callAI = async (type: string, data: any, messages?: Message[]) => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("ai-case-assistant", {
        body: { type, data, messages },
      });

      if (error) throw error;
      
      if (result.error) {
        if (result.error.includes("Rate limit")) {
          toast({
            title: "Rate Limit Reached",
            description: "Too many requests. Please wait a moment.",
            variant: "destructive",
          });
        } else if (result.error.includes("credits")) {
          toast({
            title: "AI Credits Exhausted",
            description: "Please contact your administrator to add credits.",
            variant: "destructive",
          });
        } else {
          throw new Error(result.error);
        }
        return null;
      }

      return result.response;
    } catch (error) {
      console.error("AI Error:", error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return;

    const userMessage: Message = { role: "user", content: chatInput };
    const updatedMessages = [...chatMessages, userMessage];
    setChatMessages(updatedMessages);
    setChatInput("");

    const response = await callAI("chat", { message: chatInput }, updatedMessages);

    if (response) {
      setChatMessages([...updatedMessages, { role: "assistant", content: response }]);
    }
  };

  const handleAnalyzeCase = async () => {
    if (!analysisInput.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter case details to analyze.",
        variant: "destructive",
      });
      return;
    }

    const response = await callAI("analyze_case", { caseDetails: analysisInput });
    if (response) {
      setAnalysisResult(response);
    }
  };

  const handleInvestigationTips = async () => {
    const response = await callAI("investigation_tips", { 
      query: "Provide cyber crime investigation best practices" 
    });
    if (response) {
      setAnalysisResult(response);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <CardTitle>AI Investigation Assistant</CardTitle>
          </div>
          <CardDescription>
            AI-powered tools to assist with case analysis, evidence review, and investigation guidance
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chat">
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="analyze">
            <Search className="h-4 w-4 mr-2" />
            Analyze Case
          </TabsTrigger>
          <TabsTrigger value="report">
            <FileText className="h-4 w-4 mr-2" />
            Draft Report
          </TabsTrigger>
          <TabsTrigger value="tips">
            <Lightbulb className="h-4 w-4 mr-2" />
            Tips
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Chat Assistant</CardTitle>
              <CardDescription>Ask questions about cases, investigations, or procedures</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 max-h-96 overflow-y-auto bg-muted/30 p-4 rounded-lg">
                {chatMessages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Start a conversation with the AI assistant
                  </p>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground ml-8"
                          : "bg-background mr-8"
                      }`}
                    >
                      <Badge variant={msg.role === "user" ? "secondary" : "outline"} className="mb-2">
                        {msg.role === "user" ? "You" : "AI Assistant"}
                      </Badge>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <Textarea
                  placeholder="Ask a question..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleChatSubmit();
                    }
                  }}
                  className="min-h-[60px]"
                />
                <Button
                  onClick={handleChatSubmit}
                  disabled={loading || !chatInput.trim()}
                  className="min-w-[100px]"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analyze" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Case Analysis</CardTitle>
              <CardDescription>Get AI-powered insights and recommendations for your case</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Enter case details (case number, description, evidence collected, suspects, etc.)"
                value={analysisInput}
                onChange={(e) => setAnalysisInput(e.target.value)}
                className="min-h-[120px]"
              />
              <Button onClick={handleAnalyzeCase} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                Analyze Case
              </Button>

              {analysisResult && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Analysis Results:</h3>
                  <p className="text-sm whitespace-pre-wrap">{analysisResult}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Report Generator</CardTitle>
              <CardDescription>Generate professional investigation reports with AI assistance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Enter case summary and key findings to generate a professional report..."
                className="min-h-[120px]"
              />
              <Button disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                Generate Report
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tips" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Investigation Tips & Best Practices</CardTitle>
              <CardDescription>Get expert guidance on cyber crime investigation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleInvestigationTips} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lightbulb className="h-4 w-4 mr-2" />}
                Get Investigation Tips
              </Button>

              {analysisResult && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Expert Guidance:</h3>
                  <p className="text-sm whitespace-pre-wrap">{analysisResult}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
