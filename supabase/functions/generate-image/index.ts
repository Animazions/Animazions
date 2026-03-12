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

const KIE_IMG2IMG_MODEL_MAP: Record<string, string> = {
  "Nano Banana Pro": "nano-banana-pro",
  "Seedream 5.0 Lite": "seedream/5-lite-image-to-image",
};

async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { prompt, model, imageAnalysis, referenceImageUrl } = await req.json();

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const hasReference = !!referenceImageUrl && typeof referenceImageUrl === "string";

    let enhancedPrompt = prompt;
    if (imageAnalysis && imageAnalysis.fullDescription) {
      enhancedPrompt = `${prompt}

REFERENCE IMAGE STYLE CHARACTERISTICS — STRICT CONSISTENCY REQUIRED:
Art Style: ${imageAnalysis.artStyle}
Color Palette: ${imageAnalysis.colorPalette}
Characters: ${imageAnalysis.characters}
Backgrounds: ${imageAnalysis.backgrounds}
Composition: ${imageAnalysis.composition}
Lighting: ${imageAnalysis.lighting}
Mood: ${imageAnalysis.mood}

CRITICAL: You MUST replicate the exact art style, color palette, character designs, line art, shading, backgrounds, and overall aesthetic from the reference image with maximum fidelity. Any deviation in style, character appearance, or color is unacceptable.`;
    }

    const trimmedPrompt = enhancedPrompt.trim();
    const encodedPrompt = encodeURIComponent(trimmedPrompt);

    if (model === "Flux (Pollinations)" || model === "Turbo (Pollinations)" || !KIE_MODEL_MAP[model]) {
      const pollinationsModel = model === "Turbo (Pollinations)" ? "turbo" : "flux";
      let imageUrl: string;

      if (hasReference) {
        const encodedRef = encodeURIComponent(referenceImageUrl);
        imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=${pollinationsModel}&width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 999999)}&image=${encodedRef}`;
      } else {
        imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=${pollinationsModel}&width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 999999)}`;
      }

      return new Response(
        JSON.stringify({ imageUrl }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const kieApiKey = Deno.env.get("KIE_AI_API_KEY");
    if (!kieApiKey) {
      throw new Error(`${model} requires KIE_AI_API_KEY configuration`);
    }

    let kieModel = KIE_MODEL_MAP[model];
    const extraInput: Record<string, unknown> = model === "Seedream 5.0 Lite" ? { quality: "basic" } : {};

    if (hasReference) {
      const img2imgModel = KIE_IMG2IMG_MODEL_MAP[model];
      if (img2imgModel) {
        kieModel = img2imgModel;
        const base64Image = await fetchImageAsBase64(referenceImageUrl);
        if (base64Image) {
          extraInput.image = base64Image;
          extraInput.image_strength = 0.35;
        }
      }
    }

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
