import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmergencyAlertRequest {
  message?: string;
  latitude?: number | null;
  longitude?: number | null;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || supabaseAnonKey;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const resendFromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "Guardian Connect <onboarding@resend.dev>";

    // Initialize Supabase Client with Auth header to verify user
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Validate authentication token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid or expired authentication token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Admin Supabase Client to bypass RLS for updating alert status if needed
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Fetch user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
    }

    // Determine recipient email: check profile first, then fallback to primary emergency_contacts entry
    let contactEmail = profile?.emergency_contact_email?.trim() || null;
    let contactName = profile?.emergency_contact_name?.trim() || "Emergency Contact";

    if (!contactEmail) {
      const { data: contacts } = await supabaseAdmin
        .from("emergency_contacts")
        .select("email, name")
        .eq("user_id", user.id)
        .order("is_primary", { ascending: false })
        .limit(1);

      if (contacts && contacts.length > 0 && contacts[0].email) {
        contactEmail = contacts[0].email.trim();
        contactName = contacts[0].name || contactName;
      }
    }

    // Parse request body
    let body: EmergencyAlertRequest = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is okay, defaults used
    }

    const alertMessage = body.message?.trim() || "Emergency SOS alert triggered by user.";
    const latitude = typeof body.latitude === "number" ? body.latitude : null;
    const longitude = typeof body.longitude === "number" ? body.longitude : null;
    const userName = profile?.full_name || user.user_metadata?.full_name || user.email || "Guardian Connect User";

    // Validate emergency contact email
    if (!contactEmail) {
      // Create record with failed status if no contact configured
      const { data: failedAlert } = await supabaseAdmin
        .from("emergency_alerts")
        .insert({
          user_id: user.id,
          message: alertMessage,
          latitude,
          longitude,
          status: "failed",
          email_sent_to: null,
        })
        .select()
        .single();

      return new Response(
        JSON.stringify({
          error: "Please configure an emergency contact before using this feature.",
          alert: failedAlert,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert pending emergency_alerts record
    const { data: alertRecord, error: insertError } = await supabaseAdmin
      .from("emergency_alerts")
      .insert({
        user_id: user.id,
        message: alertMessage,
        latitude,
        longitude,
        status: "pending",
        email_sent_to: contactEmail,
      })
      .select()
      .single();

    if (insertError || !alertRecord) {
      console.error("Failed to create emergency_alerts record:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to record emergency alert in database" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check Resend API Key
    if (!resendApiKey) {
      console.warn("RESEND_API_KEY environment variable is not configured.");
      await supabaseAdmin
        .from("emergency_alerts")
        .update({ status: "failed" })
        .eq("id", alertRecord.id);

      return new Response(
        JSON.stringify({
          error: "RESEND_API_KEY is not configured on the server. Please set the RESEND_API_KEY secret in Supabase Edge Function settings.",
          alert: { ...alertRecord, status: "failed" },
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare location string and link
    const hasLocation = latitude !== null && longitude !== null;
    const locationStr = hasLocation ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` : "Location unavailable";
    const mapLink = hasLocation ? `https://www.google.com/maps?q=${latitude},${longitude}` : "N/A";
    const timestampStr = new Date().toLocaleString("en-US", { timeZoneName: "short" });

    // Format Email Body
    const emailText = `🚨 GUARDIAN CONNECT EMERGENCY ALERT

User:
${userName} (${user.email || "No email"})

Message:
${alertMessage}

Time:
${timestampStr}

Location:
${locationStr}

Location link:
${mapLink}

Please contact the user immediately.`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #ef4444; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #ef4444; color: #ffffff; padding: 16px 24px;">
          <h1 style="margin: 0; font-size: 20px; font-weight: bold;">🚨 GUARDIAN CONNECT EMERGENCY ALERT</h1>
        </div>
        <div style="padding: 24px; background-color: #ffffff; color: #1f2937; line-height: 1.6;">
          <p style="font-size: 16px; font-weight: bold; color: #b91c1c; margin-top: 0;">
            Immediate assistance may be required for ${userName}.
          </p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 140px; color: #4b5563;">User:</td>
              <td style="padding: 8px 0; font-weight: 600;">${userName} &lt;${user.email || ""}&gt;</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Message:</td>
              <td style="padding: 8px 0; background-color: #fef2f2; border-left: 4px solid #ef4444; padding-left: 12px;">${alertMessage}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Time:</td>
              <td style="padding: 8px 0;">${timestampStr}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Location:</td>
              <td style="padding: 8px 0;">${locationStr}</td>
            </tr>
            ${
              hasLocation
                ? `<tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Map Link:</td>
                    <td style="padding: 8px 0;"><a href="${mapLink}" target="_blank" style="color: #2563eb; text-decoration: underline; font-weight: 600;">View Location on Google Maps</a></td>
                  </tr>`
                : `<tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Map Link:</td>
                    <td style="padding: 8px 0; color: #9ca3af; italic;">Location permission was unavailable</td>
                  </tr>`
            }
          </table>
          <div style="margin-top: 24px; padding: 12px; background-color: #fff1f2; border-radius: 6px; border: 1px solid #fecdd3; color: #9f1239; font-weight: bold; text-align: center;">
            Please contact the user immediately.
          </div>
        </div>
        <div style="background-color: #f9fafb; padding: 12px 24px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center;">
          Sent automatically by Guardian Connect Safety Alert System
        </div>
      </div>
    `;

    // Send email via Resend REST API
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: resendFromEmail,
        to: [contactEmail],
        subject: `🚨 GUARDIAN CONNECT EMERGENCY ALERT: ${userName}`,
        text: emailText,
        html: emailHtml,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend API error:", resendData);
      await supabaseAdmin
        .from("emergency_alerts")
        .update({ status: "failed" })
        .eq("id", alertRecord.id);

      return new Response(
        JSON.stringify({
          error: resendData.message || "Failed to send email via Resend API",
          alert: { ...alertRecord, status: "failed" },
          details: resendData,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update alert status to sent
    const nowIso = new Date().toISOString();
    const { data: updatedAlert } = await supabaseAdmin
      .from("emergency_alerts")
      .update({ status: "sent", sent_at: nowIso })
      .eq("id", alertRecord.id)
      .select()
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        message: `Emergency alert sent to ${contactEmail}`,
        alert: updatedAlert || { ...alertRecord, status: "sent", sent_at: nowIso },
        resend_id: resendData.id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    console.error("Unhandled error in Edge Function:", err);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
