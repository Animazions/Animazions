import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface VideoGenerationRequest {
  prompt: string;
  model: string;
  storyboardImageUrls?: string[];
  moodboardImageUrls?: string[];
  duration?: 5 | 10 | 15;
  userId: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body: VideoGenerationRequest = await req.json();
    const {
      prompt,
      model,
      storyboardImageUrls = [],
      moodboardImageUrls = [],
      duration = 5,
      userId,
    } = body;

    if (!prompt || !model) {
      return new Response(
        JSON.stringify({ error: "Missing prompt or model" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const enhancedPrompt = buildEnhancedPrompt(prompt, storyboardImageUrls, moodboardImageUrls);

    const allImageUrls = [...storyboardImageUrls, ...moodboardImageUrls].filter(Boolean);

    const videoBuffer = await fetchVideoFromPollinations(enhancedPrompt, duration, allImageUrls);

    const fileName = `${userId}/${Date.now()}_clip_${duration}s.mp4`;
    const { error: uploadError } = await supabase.storage
      .from("generated-videos")
      .upload(fileName, videoBuffer, {
        contentType: "video/mp4",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    const { data: signedData, error: signedError } = await supabase.storage
      .from("generated-videos")
      .createSignedUrl(fileName, 60 * 60 * 24 * 7);

    if (signedError || !signedData?.signedUrl) {
      throw new Error(`Failed to create signed URL: ${signedError?.message}`);
    }

    return new Response(
      JSON.stringify({ videoUrl: signedData.signedUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Video generation error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildEnhancedPrompt(
  userPrompt: string,
  storyboardUrls: string[],
  moodboardUrls: string[]
): string {
  let enhancedPrompt = userPrompt;

  if (storyboardUrls.length > 0) {
    enhancedPrompt += `, maintaining consistent characters and environments from the storyboard reference`;
  }

  if (moodboardUrls.length > 0) {
    enhancedPrompt += `, with the visual style and mood from the provided style references`;
  }

  enhancedPrompt += `, high quality animation, cinematic, smooth motion`;
  return enhancedPrompt;
}

async function fetchVideoFromPollinations(
  prompt: string,
  duration: number,
  imageUrls: string[]
): Promise<Uint8Array> {
  const clampedDuration = Math.max(2, Math.min(15, duration));
  const encodedPrompt = encodeURIComponent(prompt);

  const params = new URLSearchParams({
    model: "wan",
    duration: String(clampedDuration),
    aspectRatio: "16:9",
    enhance: "true",
    nologo: "true",
    private: "true",
  });

  if (imageUrls.length > 0) {
    params.set("image", imageUrls.slice(0, 4).join("|"));
  }

  const url = `https://gen.pollinations.ai/image/${encodedPrompt}?${params.toString()}`;
  console.log("Fetching video from Pollinations:", url);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 240000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "AnimationStudio/1.0",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pollinations API error ${response.status}: ${errorText}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("video")) {
      const body = await response.text();
      throw new Error(`Expected video response but got ${contentType}: ${body.slice(0, 200)}`);
    }

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength < 1000) {
      throw new Error(`Video too small (${buffer.byteLength} bytes) — generation may have failed`);
    }

    return new Uint8Array(buffer);
  } finally {
    clearTimeout(timeoutId);
  }
}
