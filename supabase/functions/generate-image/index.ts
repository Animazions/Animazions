import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const KIE_MODEL_MAP: Record<string, string> = {
  "Nano Banana Pro": "nano-banana-pro",
  "Qwen Image": "qwen-vl-max",
  "Seedream 5.0 Lite": "seedream/5-lite-text-to-image",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { prompt, model } = await req.json();

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const trimmedPrompt = prompt.trim();
    const encodedPrompt = encodeURIComponent(trimmedPrompt);

    if (model === "Flux (Pollinations)" || model === "Turbo (Pollinations)" || !KIE_MODEL_MAP[model]) {
      const pollinationsModel = model === "Turbo (Pollinations)" ? "turbo" : "flux";
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=${pollinationsModel}&width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 999999)}`;
      return new Response(
        JSON.stringify({ imageUrl }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const kieApiKey = Deno.env.get("KIE_AI_API_KEY");
    if (!kieApiKey) {
      throw new Error(`${model} requires KIE_AI_API_KEY configuration`);
    }

    const kieModel = KIE_MODEL_MAP[model];
    const extraInput: Record<string, string> = model === "Seedream 5.0 Lite" ? { quality: "basic" } : {};

    const taskResponse = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${kieApiKey}`,
      },
      body: JSON.stringify({
        model: kieModel,
        input: {
          prompt: trimmedPrompt,
          aspect_ratio: "1:1",
          ...extraInput,
        },
      }),
    });

    const taskData = await taskResponse.json() as any;

    if (!taskResponse.ok || taskData.code !== 200) {
      throw new Error(`KIE.AI error: ${taskData.message || JSON.stringify(taskData)}`);
    }

    const taskId = taskData.data?.taskId || taskData.data?.task_id || taskData.taskId;

    if (!taskId) {
      throw new Error(`No task ID returned. Response: ${JSON.stringify(taskData)}`);
    }

    return new Response(
      JSON.stringify({ taskId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
