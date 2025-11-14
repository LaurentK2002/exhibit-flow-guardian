import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, data, messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    // Different AI capabilities based on request type
    switch (type) {
      case "analyze_case":
        systemPrompt = `You are an expert cyber crime investigator assistant for the Tanzania Police Force. 
        Analyze case details and provide:
        1. Key findings and patterns
        2. Recommended investigation steps
        3. Potential evidence to collect
        4. Similar case patterns
        5. Risk assessment
        Keep responses professional, actionable, and focused on Tanzanian cyber crime context.`;
        userPrompt = `Analyze this case: ${JSON.stringify(data)}`;
        break;

      case "summarize_evidence":
        systemPrompt = `You are a digital forensics expert. Summarize evidence clearly and highlight:
        1. Critical findings
        2. Digital artifacts discovered
        3. Timeline of events
        4. Recommendations for further analysis`;
        userPrompt = `Summarize this evidence: ${JSON.stringify(data)}`;
        break;

      case "draft_report":
        systemPrompt = `You are a professional report writer for cyber crime investigations.
        Create a formal, structured report suitable for law enforcement with:
        1. Executive summary
        2. Case details
        3. Investigation findings
        4. Evidence analysis
        5. Conclusions and recommendations
        Use formal, professional language appropriate for Tanzanian law enforcement.`;
        userPrompt = `Draft a professional report for: ${JSON.stringify(data)}`;
        break;

      case "investigation_tips":
        systemPrompt = `You are a cyber crime investigation mentor. Provide practical, actionable tips for:
        1. Investigation techniques
        2. Evidence preservation
        3. Digital forensics best practices
        4. Legal considerations in Tanzania
        Focus on practical, field-applicable advice.`;
        userPrompt = data.query || "Provide general cyber crime investigation tips";
        break;

      case "chat":
        systemPrompt = `You are an AI assistant for the Tanzania Police Force Cyber Crimes Investigation Unit.
        Help investigators with:
        - Case analysis and insights
        - Investigation methodology
        - Digital forensics guidance
        - Evidence handling procedures
        - Cyber crime trends in Tanzania
        Be professional, accurate, and helpful.`;
        userPrompt = data.message;
        break;

      default:
        throw new Error("Invalid request type");
    }

    // Build messages array
    const aiMessages = messages || [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    // Call Lovable AI Gateway
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: aiMessages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Rate limit exceeded. Please try again later." 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: "AI credits exhausted. Please contact administrator." 
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error("AI Gateway error");
    }

    const aiResponse = await response.json();
    const assistantMessage = aiResponse.choices[0].message.content;

    return new Response(JSON.stringify({ 
      response: assistantMessage,
      type 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("AI Assistant error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
