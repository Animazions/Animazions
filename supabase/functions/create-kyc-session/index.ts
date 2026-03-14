import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function getAccessToken(appId: string, appKey: string): Promise<string> {
  const tokenRes = await fetch("https://auth.didit.me/auth/v2/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: appId,
      client_secret: appKey,
    }),
  });

  const tokenText = await tokenRes.text();
  if (!tokenRes.ok) {
    throw new Error(`Didit auth failed [${tokenRes.status}]: ${tokenText}`);
  }

  let tokenData: Record<string, unknown>;
  try {
    tokenData = JSON.parse(tokenText);
  } catch {
    throw new Error(`Didit auth non-JSON response: ${tokenText}`);
  }

  if (!tokenData.access_token) {
    throw new Error(`Didit auth missing access_token: ${tokenText}`);
  }
  return tokenData.access_token as string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const DIDIT_APP_ID = Deno.env.get("DIDIT_APP_ID");
    const DIDIT_APP_KEY = Deno.env.get("DIDIT_APP_KEY");
    const DIDIT_WORKFLOW_ID = Deno.env.get("DIDIT_WORKFLOW_ID");

    if (!DIDIT_APP_ID || !DIDIT_APP_KEY || !DIDIT_WORKFLOW_ID) {
      return new Response(
        JSON.stringify({ error: `Missing Didit config: APP_ID=${!!DIDIT_APP_ID} APP_KEY=${!!DIDIT_APP_KEY} WORKFLOW_ID=${!!DIDIT_WORKFLOW_ID}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = await getAccessToken(DIDIT_APP_ID, DIDIT_APP_KEY);

    const sessionRes = await fetch("https://verification.didit.me/v3/session/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        workflow_id: DIDIT_WORKFLOW_ID,
        callback: `${Deno.env.get("SUPABASE_URL")}/functions/v1/didit-webhook`,
        vendor_data: user.id,
      }),
    });

    const sessionText = await sessionRes.text();
    if (!sessionRes.ok) {
      return new Response(
        JSON.stringify({ error: `Didit session failed [${sessionRes.status}]: ${sessionText}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let sessionData: Record<string, unknown>;
    try {
      sessionData = JSON.parse(sessionText);
    } catch {
      return new Response(
        JSON.stringify({ error: `Didit session non-JSON: ${sessionText}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await serviceClient
      .from("user_profiles")
      .upsert({
        id: user.id,
        kyc_session_id: sessionData.session_id ?? sessionData.id,
        kyc_status: "pending",
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });

    return new Response(
      JSON.stringify({
        session_id: sessionData.session_id ?? sessionData.id,
        session_url: sessionData.url ?? sessionData.session_url,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
