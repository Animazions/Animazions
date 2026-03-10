import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { taskId } = await req.json();

    if (!taskId || typeof taskId !== "string") {
      return new Response(
        JSON.stringify({ error: "taskId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const kieApiKey = Deno.env.get("KIE_AI_API_KEY");
    if (!kieApiKey) {
      throw new Error("KIE_AI_API_KEY not configured");
    }

    const statusResponse = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${kieApiKey}`,
      },
    });

    if (!statusResponse.ok) {
      throw new Error(`KIE.AI status check failed: ${statusResponse.status}`);
    }

    const statusData = await statusResponse.json() as any;
    const record = statusData.data;

    if (!record) {
      throw new Error("No task data returned from KIE.AI");
    }

    const state: string = record.state || record.status || "";

    if (state === "success" && record.resultJson) {
      let result: any;
      try {
        result = typeof record.resultJson === "string"
          ? JSON.parse(record.resultJson)
          : record.resultJson;
      } catch {
        throw new Error("Failed to parse KIE.AI result");
      }

      const imageUrl = result.resultUrls?.[0] || result.url || result.imageUrl || null;

      if (!imageUrl) {
        throw new Error(`No image URL in result: ${JSON.stringify(result)}`);
      }

      return new Response(
        JSON.stringify({ status: "success", imageUrl }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (state === "fail" || state === "failed" || state === "error") {
      return new Response(
        JSON.stringify({ status: "failed", error: record.failMsg || record.error || "Generation failed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ status: "pending", state }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
