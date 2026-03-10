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
      return await generateWithKieAi(prompt.trim(), "qwen-image", kieApiKey, corsHeaders);
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
      const taskResponse = await fetch("https://api.kie.ai/api/v1/playground/createTask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model_name: model,
          prompt: prompt,
        }),
      });

      if (!taskResponse.ok) {
        const errorData = await taskResponse.text();
        throw new Error(`KIE.AI API error (${taskResponse.status}): ${errorData}`);
      }

      const taskData = await taskResponse.json() as any;
      const taskId = taskData.task_id || taskData.id || taskData.taskId;

      if (!taskId) {
        throw new Error(`No task ID returned from KIE.AI. Response: ${JSON.stringify(taskData)}`);
      }

      let imageUrl: string | null = null;
      const maxRetries = 60;
      let retryCount = 0;

      while (retryCount < maxRetries && !imageUrl) {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const statusResponse = await fetch(`https://api.kie.ai/api/v1/playground/recordInfo?task_id=${taskId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (statusResponse.ok) {
          const statusData = await statusResponse.json() as any;
          if (statusData.status === "success" && statusData.output_url) {
            imageUrl = statusData.output_url;
            break;
          } else if (statusData.status === "failed") {
            throw new Error(`KIE.AI task failed: ${statusData.error || "Unknown error"}`);
          }
        }

        retryCount++;
      }

      if (!imageUrl) {
        throw new Error("Image generation timed out or failed");
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
