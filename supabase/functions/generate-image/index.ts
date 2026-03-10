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
      const response = await fetch("https://api.kie.ai/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          prompt,
          model,
          n: 1,
          size: "1024x1024",
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`KIE.AI API error (${response.status}): ${errorData}`);
      }

      const data = await response.json() as any;
      const imageUrl = data.data?.[0]?.url;

      if (!imageUrl) {
        throw new Error("No image URL returned from KIE.AI");
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
