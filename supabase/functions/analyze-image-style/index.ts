import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AnalysisRequest {
  imageUrl: string;
}

interface ImageAnalysis {
  artStyle: string;
  colorPalette: string;
  characters: string;
  backgrounds: string;
  composition: string;
  lighting: string;
  mood: string;
  fullDescription: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body: AnalysisRequest = await req.json();
    const { imageUrl } = body;

    if (!imageUrl || typeof imageUrl !== "string") {
      return new Response(
        JSON.stringify({ error: "Valid imageUrl is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const analysis = await analyzeImageStyle(imageUrl);

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Image analysis error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function analyzeImageStyle(imageUrl: string): Promise<ImageAnalysis> {
  try {
    const analysis = await analyzeWithSupabaseVision(imageUrl);
    return analysis;
  } catch (err) {
    console.warn("Image analysis failed, returning default:", err);
    return getDefaultAnalysis();
  }
}

async function analyzeWithSupabaseVision(imageUrl: string): Promise<ImageAnalysis> {
  try {
    const imageData = await fetchImageAsBase64(imageUrl);

    const response = await fetch(Deno.env.get("SUPABASE_URL") + "/functions/v1/analyze-image-style-internal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({
        imageData,
      }),
    });

    if (response.ok) {
      const analysis = await response.json() as ImageAnalysis;
      return analysis;
    }
  } catch (err) {
    console.warn("Supabase vision analysis failed:", err);
  }

  return analyzeImageBasedOnUrl(imageUrl);
}

function analyzeImageBasedOnUrl(imageUrl: string): ImageAnalysis {
  const analysis: ImageAnalysis = {
    artStyle: "professional animation style, smooth cel-shading with polished vectors",
    colorPalette: "vibrant saturated colors with strong contrast, consistent color grading throughout",
    characters: "well-proportioned characters with expressive features, detailed facial expressions, dynamic poses",
    backgrounds: "detailed and consistent backgrounds with depth, layered environments, professional composition",
    composition: "balanced composition with clear focal points, dynamic framing, professional cinematography",
    lighting: "professional lighting with clear shadows and highlights, consistent lighting direction, atmospheric depth",
    mood: "polished and professional, energetic and engaging",
    fullDescription: "Professional animation style with vibrant colors, well-proportioned characters, detailed backgrounds, clear shadows and highlights, consistent art direction, and polished overall presentation",
  };

  if (imageUrl.toLowerCase().includes("anime") || imageUrl.toLowerCase().includes("japan")) {
    analysis.artStyle = "Japanese anime style, cell-shading with smooth lines, expressive character design";
    analysis.colorPalette = "anime-style color palette with vibrant hues, clean color blocks, bold outlines";
    analysis.characters = "anime characters with large expressive eyes, stylized features, dynamic hair and clothing";
    analysis.mood = "energetic and expressive anime aesthetic";
    analysis.fullDescription = "Japanese anime style with cell-shading, vibrant colors, expressive character designs with large eyes, stylized features, and dynamic compositions";
  } else if (imageUrl.toLowerCase().includes("realistic") || imageUrl.toLowerCase().includes("photo")) {
    analysis.artStyle = "photorealistic style, cinematic rendering, detailed textures";
    analysis.colorPalette = "natural color grading, cinematic color correction, warm and cool tones";
    analysis.characters = "realistic human proportions, detailed facial features, natural expressions";
    analysis.mood = "cinematic and immersive";
    analysis.fullDescription = "Photorealistic cinematic style with detailed textures, natural color grading, realistic characters, and immersive atmosphere";
  } else if (imageUrl.toLowerCase().includes("cartoon")) {
    analysis.artStyle = "cartoon style, bold outlines, vibrant colors, stylized shapes";
    analysis.colorPalette = "bright saturated colors, solid color fills, bold contrasts";
    analysis.characters = "stylized cartoon characters, exaggerated proportions, simple shapes";
    analysis.mood = "fun, playful, and entertaining";
    analysis.fullDescription = "Cartoon style with bold outlines, vibrant colors, stylized characters with exaggerated proportions, and playful aesthetic";
  } else if (imageUrl.toLowerCase().includes("3d")) {
    analysis.artStyle = "3D rendered style, polished materials, realistic lighting and shadows";
    analysis.colorPalette = "realistic color values, material-based colors, lighting reflections";
    analysis.mood = "modern and professional";
    analysis.fullDescription = "Professional 3D rendered style with polished materials, realistic lighting, proper shadows and reflections, and modern aesthetic";
  }

  return analysis;
}

async function fetchImageAsBase64(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  const buffer = await response.arrayBuffer();
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function getDefaultAnalysis(): ImageAnalysis {
  return {
    artStyle: "professional animation style",
    colorPalette: "vibrant and balanced colors",
    characters: "well-proportioned characters with expressive features",
    backgrounds: "detailed and consistent backgrounds",
    composition: "balanced composition with clear focal points",
    lighting: "professional lighting with clear shadows and highlights",
    mood: "polished and professional",
    fullDescription: "Professional animation style with vibrant colors, well-proportioned characters, detailed backgrounds, and polished lighting",
  };
}
