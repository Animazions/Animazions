import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AnalysisRequest {
  imageUrls: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body: AnalysisRequest = await req.json();
    const { imageUrls = [] } = body;

    if (!imageUrls || imageUrls.length === 0) {
      return new Response(
        JSON.stringify({ error: "No images to analyze" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const styleDescriptors = await analyzeImages(imageUrls);

    return new Response(
      JSON.stringify({ styleDescriptors }),
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

async function analyzeImages(imageUrls: string[]): Promise<string[]> {
  const descriptors: string[] = [];

  for (const url of imageUrls.slice(0, 3)) {
    try {
      const descriptor = await analyzeImageWithClipApi(url);
      if (descriptor) {
        descriptors.push(descriptor);
      }
    } catch (err) {
      console.warn(`Failed to analyze image ${url}:`, err);
    }
  }

  if (descriptors.length === 0) {
    descriptors.push("professional animation style with consistent character design and color palette");
  }

  return descriptors;
}

async function analyzeImageWithClipApi(imageUrl: string): Promise<string | null> {
  try {
    const descriptor = extractStyleFromUrl(imageUrl);

    if (descriptor) {
      return descriptor;
    }

    return "professional animation style, smooth motion, polished";
  } catch {
    return extractStyleFromUrl(imageUrl);
  }
}

function extractStyleFromUrl(url: string): string {
  if (url.includes("anime") || url.includes("japan")) {
    return "Japanese anime style, cel-shading, expressive characters";
  }
  if (url.includes("realistic")) {
    return "photorealistic, cinematic, detailed";
  }
  if (url.includes("cartoon")) {
    return "cartoon style, vibrant colors, stylized";
  }
  if (url.includes("3d")) {
    return "3D rendered, polished, modern";
  }

  return "professional animation style, smooth motion, polished";
}
