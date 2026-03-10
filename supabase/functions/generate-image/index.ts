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
    const { prompt, model } = await req.json();

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const encodedPrompt = encodeURIComponent(prompt.trim());
    let imageUrl: string;
    const kieApiKey = Deno.env.get("KIE_AI_API_KEY");

    if (model === "Flux (Pollinations)") {
      imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=flux&width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 999999)}`;
    } else if (model === "Turbo (Pollinations)") {
      imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=turbo&width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 999999)}`;
    } else if (model === "Nano Banana Pro") {
      if (!kieApiKey) {
        throw new Error("Nano Banana Pro requires KIE_AI_API_KEY configuration");
      }
      return await generateWithKieAi(prompt.trim(), "nano-banana-pro", kieApiKey, corsHeaders);
    } else if (model === "Qwen Image") {
      if (!kieApiKey) {
        throw new Error("Qwen Image requires KIE_AI_API_KEY configuration");
      }
      return await generateWithKieAi(prompt.trim(), "qwen-vl-max", kieApiKey, corsHeaders);
    } else {
      imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=flux&width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 999999)}`;
    }

    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) {
      throw new Error(`Image generation failed: ${imageRes.status} ${imageRes.statusText}`);
    }

    const arrayBuffer = await imageRes.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const dataUrl = `data:image/jpeg;base64,${base64}`;

    return new Response(
      JSON.stringify({ imageUrl: dataUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  async function generateWithKieAi(
    prompt: string,
    model: string,
    apiKey: string,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    try {
      const taskResponse = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          input: {
            prompt: prompt,
            aspect_ratio: "1:1",
          },
        }),
      });

      const taskData = await taskResponse.json() as any;

      if (!taskResponse.ok || taskData.code !== 200) {
        throw new Error(`KIE.AI API error (${taskResponse.status}): ${JSON.stringify(taskData)}`);
      }

      const taskId = taskData.data?.taskId || taskData.data?.task_id || taskData.taskId;

      if (!taskId) {
        throw new Error(`No task ID returned from KIE.AI. Response: ${JSON.stringify(taskData)}`);
      }

      let imageUrl: string | null = null;
      const maxRetries = 60;
      let retryCount = 0;

      while (retryCount < maxRetries && !imageUrl) {
        await new Promise(resolve => setTimeout(resolve, 2000));

        const statusResponse = await fetch(`https://api.kie.ai/api/v1/jobs/taskInfo?taskId=${taskId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
        });

        if (statusResponse.ok) {
          const statusData = await statusResponse.json() as any;
          const record = statusData.data;

          if (record?.state === "success" && record?.resultJson) {
            try {
              const result = JSON.parse(record.resultJson);
              imageUrl = result.resultUrls?.[0] || null;
            } catch {
              throw new Error("Failed to parse KIE.AI result JSON");
            }
            if (imageUrl) break;
          } else if (record?.state === "fail") {
            throw new Error(`KIE.AI task failed: ${record.failMsg || "Unknown error"}`);
          }
        }

        retryCount++;
      }

      if (!imageUrl) {
        throw new Error("Image generation timed out or no result URL returned");
      }

      const imageRes = await fetch(imageUrl);
      if (!imageRes.ok) {
        throw new Error(`Failed to fetch image from KIE.AI: ${imageRes.status}`);
      }

      const arrayBuffer = await imageRes.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      const dataUrl = `data:image/jpeg;base64,${base64}`;

      return new Response(
        JSON.stringify({ imageUrl: dataUrl }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: err?.message || "KIE.AI generation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }
});
