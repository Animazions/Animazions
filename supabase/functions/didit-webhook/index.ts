import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();

    const status = body.status as string;
    const sessionId = body.session_id ?? body.id;
    const userId = body.vendor_data;

    if (!userId || !sessionId) {
      return new Response(JSON.stringify({ error: "Missing vendor_data or session_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const isApproved = status === "Approved" || status === "approved";
    const isRejected = status === "Declined" || status === "declined" || status === "rejected";

    const updatePayload: Record<string, unknown> = {
      kyc_session_id: sessionId,
      kyc_status: isApproved ? "approved" : isRejected ? "rejected" : "pending",
      kyc_verified: isApproved,
      updated_at: new Date().toISOString(),
    };

    if (isApproved) {
      updatePayload.kyc_completed_at = new Date().toISOString();
    }

    await serviceClient
      .from("user_profiles")
      .upsert({ id: userId, ...updatePayload }, { onConflict: "id" });

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
