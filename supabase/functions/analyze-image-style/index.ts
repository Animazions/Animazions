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

  return descriptors.length > 0
    ? descriptors
    : ["high quality animation, professional style"];
}

async function analyzeImageWithClipApi(imageUrl: string): Promise<string | null> {
  try {
    const response = await fetch("https://api.clarifai.com/v2/models/general-image-recognition/outputs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Key ${Deno.env.get("CLARIFAI_PAT") || ""}`,
      },
      body: JSON.stringify({
        inputs: [
          {
            data: {
              image: {
                url: imageUrl,
              },
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      return extractStyleFromUrl(imageUrl);
    }

    const data = await response.json() as any;
    const concepts = data?.outputs?.[0]?.data?.concepts || [];

    if (concepts.length > 0) {
      const topConcepts = concepts
        .slice(0, 5)
        .map((c: any) => c.name)
        .join(", ");
      return `style inspired by: ${topConcepts}`;
    }

    return extractStyleFromUrl(imageUrl);
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
