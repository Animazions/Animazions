import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface VideoGenerationRequest {
  prompt: string;
  model: string;
  storyboardImages?: string[];
  moodboardImages?: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const body: VideoGenerationRequest = await req.json();
    const { prompt, model, storyboardImages = [], moodboardImages = [] } = body;

    if (!prompt || !model) {
      return new Response(
        JSON.stringify({ error: "Missing prompt or model" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (model !== "Pollinations Video (FREE)") {
      return new Response(
        JSON.stringify({ error: "Only Pollinations Video (FREE) is supported" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const enhancedPrompt = buildPrompt(prompt, storyboardImages, moodboardImages);
    const videoUrl = generateVideoUrl(enhancedPrompt);

    return new Response(
      JSON.stringify({ videoUrl }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Video generation error:", errorMessage);

    return new Response(
      JSON.stringify({ error: errorMessage || "Video generation failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function buildPrompt(
  userPrompt: string,
  storyboardImages: string[],
  moodboardImages: string[]
): string {
  let enhancedPrompt = userPrompt;

  if (storyboardImages.length > 0) {
    enhancedPrompt += "\n[Visual reference: storyboard images provided]";
  }

  if (moodboardImages.length > 0) {
    enhancedPrompt += "\n[Style reference: mood board images provided]";
  }

  return enhancedPrompt;
}

function generateVideoUrl(prompt: string): string {
  const encodedPrompt = encodeURIComponent(prompt);
  const pollUrl = `https://image.pollinations.ai/video?prompt=${encodedPrompt}&width=1024&height=576&duration=5`;
  return pollUrl;
}
