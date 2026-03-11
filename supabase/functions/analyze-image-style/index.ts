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
    const imageData = await fetchImageAsBase64(imageUrl);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY") || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: imageData,
                },
              },
              {
                type: "text",
                text: `Analyze this image in detail and provide a comprehensive style analysis. Return ONLY valid JSON (no markdown, no code blocks) with exactly these fields:
{
  "artStyle": "specific art style, technique, and visual approach",
  "colorPalette": "dominant colors, color scheme, and color grading",
  "characters": "character designs, facial features, clothing, proportions, expressions",
  "backgrounds": "environment, setting, background elements, composition",
  "composition": "layout, positioning, spatial relationships, framing",
  "lighting": "lighting style, shadows, highlights, atmosphere",
  "mood": "overall mood, tone, and emotional atmosphere",
  "fullDescription": "comprehensive description combining all elements for image generation"
}

Be specific and detailed. Focus on exact visual characteristics that should be replicated.`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Claude API error:", errorText);
      return getDefaultAnalysis();
    }

    const data = await response.json();
    const analysisText = data.content[0].text;

    const analysis = JSON.parse(analysisText) as ImageAnalysis;
    return analysis;
  } catch (err) {
    console.warn("Image analysis failed, returning default:", err);
    return getDefaultAnalysis();
  }
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
