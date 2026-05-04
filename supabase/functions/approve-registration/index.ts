// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const payload = await req.json();
    const { request_id, action, admin_notes } = payload;

    if (!request_id || !action) {
      return new Response(JSON.stringify({ error: "Missing request_id or action" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (action !== "approve" && action !== "reject") {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";

    if (!serviceKey || !supabaseUrl) {
      return new Response(JSON.stringify({ error: "Missing Supabase credentials" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // Get the request
    const { data: request, error: requestError } = await supabase
      .from("registration_requests")
      .select("*")
      .eq("id", request_id)
      .single();

    if (requestError || !request) {
      return new Response(JSON.stringify({ error: "Request not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (request.status !== "pending") {
      return new Response(JSON.stringify({ error: `Request already ${request.status}` }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Hash password for email signup users
    async function hashPassword(password: string): Promise<string> {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    }

    let newUserId: string | null = null;

    if (action === "approve") {
      const userMetadata = {
        nombre: request.nombre,
        apellido: request.apellido,
        tipo_relacion: request.tipo_relacion,
        rama: request.rama,
        nombre_scout_relacionado: request.nombre_scout_relacionado,
        profile_complete: true,
        approved_at: new Date().toISOString(),
        ...(request.metadata || {}),
      };

      console.log("Approving request:", request.id, "provider:", request.provider, "email:", request.email);

      if (request.provider === "google") {
        // Google OAuth - user already exists in auth.users
        // Try to find by provider_id first (Supabase UUID)
        if (request.provider_id) {
          console.log("Trying to update by provider_id:", request.provider_id);
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            request.provider_id,
            { user_metadata: userMetadata }
          );

          if (updateError) {
            console.log("Update by provider_id failed:", updateError.message, "- trying email lookup");
          } else {
            newUserId = request.provider_id;
            console.log("Successfully updated by provider_id");
          }
        }

        // If provider_id failed, try to find by email
        if (!newUserId) {
          console.log("Searching user by email:", request.email);
          const { data: userList, error: listError } = await supabase.auth.admin.listUsers();
          
          if (listError) {
            console.error("Failed to list users:", listError.message);
            return new Response(JSON.stringify({ error: "Failed to list users: " + listError.message }), {
              status: 500,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            });
          }

          const users = userList?.users || [];
          console.log("Found", users.length, "total users in system");
          
          const existingUser = users.find(u => u.email?.toLowerCase() === request.email.toLowerCase());
          
          if (existingUser) {
            console.log("Found existing user:", existingUser.id);
            const { error: updateError } = await supabase.auth.admin.updateUserById(
              existingUser.id,
              { user_metadata: userMetadata }
            );

            if (updateError) {
              console.error("Failed to update user:", updateError.message);
              return new Response(JSON.stringify({ error: "Failed to update user: " + updateError.message }), {
                status: 500,
                headers: { "Content-Type": "application/json", ...corsHeaders },
              });
            }

            newUserId = existingUser.id;
            console.log("Successfully updated existing user");
          } else {
            console.error("No user found with email:", request.email);
            return new Response(JSON.stringify({ error: "User not found with email: " + request.email }), {
              status: 404,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            });
          }
        }
      } else {
        // Email signup - create new user
        console.log("Creating new user for email:", request.email);
        
        // First check if user already exists
        const { data: userList, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        if (listError) {
          console.warn("Could not check existing users:", listError.message);
        }
        
        const existingUser = userList?.users?.find(u => u.email?.toLowerCase() === request.email.toLowerCase());
        if (existingUser) {
          console.log("User already exists with email:", request.email, "- updating metadata instead");
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            { 
              user_metadata: userMetadata,
              email_confirm: true,
            }
          );
          
          if (updateError) {
            console.error("Error updating existing user:", updateError);
            return new Response(JSON.stringify({ error: "Failed to update existing user: " + updateError.message }), {
              status: 500,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            });
          }
          
          newUserId = existingUser.id;
        } else {
          // Create new user
          const { data: userData, error: userError } = await supabase.auth.admin.createUser({
            email: request.email,
            email_confirm: true,
            password: request.password_hash || "tempPassword123!",
            user_metadata: userMetadata,
          });

          if (userError) {
            console.error("Error creating user:", userError);
            return new Response(JSON.stringify({ error: userError.message }), {
              status: 500,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            });
          }

          newUserId = userData.user?.id;
        }
        console.log("User processed:", newUserId);
      }

      // Update request status
      await supabase
        .from("registration_requests")
        .update({ 
          status: "approved",
          reviewed_at: new Date().toISOString(),
          admin_notes: admin_notes || null,
        })
        .eq("id", request_id);

      // Update profile (trigger already created it)
      if (newUserId) {
        const fullName = `${request.nombre} ${request.apellido}`.trim();
        console.log("Updating profile for user:", newUserId);
        
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            nombre_completo: fullName,
            account_status: "activo",
            account_classification: null,
            account_review_reason: null,
          })
          .eq("user_id", newUserId);
        
        if (updateError) {
          console.error("Error updating profile:", updateError.message);
        } else {
          console.log("Profile updated successfully with activo status");
        }
      }

      // TODO: Enviar email de bienvenida cuando se configure un dominio en Resend
      // Por ahora el usuario puede loguearse directamente después de ser aprobado.
      // Para habilitar emails: verificar dominio en resend.com/domains
      // y configurar SUPABASE_SECRETS: RESEND_API_KEY + FROM_EMAIL
      console.log("Email sending skipped (no verified domain configured)");

      return new Response(JSON.stringify({ 
        ok: true, 
        action: "approved",
        userId: newUserId,
        message: "User approved successfully",
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });

    } else if (action === "reject") {
      // Update request status to rejected
      await supabase
        .from("registration_requests")
        .update({ 
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          admin_notes: admin_notes || "Rejected by admin",
        })
        .eq("id", request_id);

      return new Response(JSON.stringify({ 
        ok: true, 
        action: "rejected",
        message: "User rejected successfully",
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

  } catch (error) {
    const message = (error as any)?.message || "Unknown error";
    console.error("Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});