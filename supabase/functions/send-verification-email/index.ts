// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    // Responder a preflight inmediatamente con OK y cabeceras CORS
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  try {
    console.log('🚀 Iniciando proceso de envío de email de verificación')
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    console.log('✅ Cliente Supabase creado')

    // Verificar autenticación
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      console.error('❌ Usuario no autenticado')
      throw new Error('No autenticado')
    }

    console.log('✅ Usuario autenticado:', user.email)

    // Generar token de verificación
    console.log('🔄 Generando token de verificación...')
    const { data: tokenData, error: tokenError } = await supabaseClient
      .rpc('resend_verification_email')
      .single()

    if (tokenError) {
      console.error('❌ Error generando token:', tokenError)
      throw tokenError
    }

    console.log('✅ Token generado correctamente')

    const token = tokenData?.token
    const email = tokenData?.user_email || tokenData?.email

    if (!token || !email) {
      throw new Error('No se pudo obtener token o email del RPC resend_verification_email')
    }
  const appUrl = Deno.env.get('APP_URL') || 'http://localhost:5173'
  const verificationUrl = `${appUrl}/verificar-email?token=${token}`

    // Configurar servicio de email (ejemplo con Resend)
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    
    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY no configurado, solo devolviendo URL')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Token generado (email no enviado en desarrollo)',
          verificationUrl // En desarrollo, devolver la URL
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Enviar email con Resend
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: Deno.env.get('FROM_EMAIL') || 'Grupo Scout <noreply@tudominio.com>',
        to: [email],
        subject: '¡Verificá tu email para desbloquear funcionalidades! 🏕️',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
                .features { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
                .feature { padding: 10px 0; border-bottom: 1px solid #eee; }
                .feature:last-child { border-bottom: none; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🏕️ ¡Bienvenido a la comunidad scout!</h1>
                </div>
                <div class="content">
                  <p>¡Hola scout! 👋</p>
                  
                  <p>Ya estás registrado en nuestra plataforma, pero para acceder a todas las funcionalidades sociales necesitás verificar tu email.</p>
                  
                  <div class="features">
                    <h3>Al verificar tu email podrás:</h3>
                    <div class="feature">🗣️ <strong>Comuni 7</strong> - Interactuar con otros scouts, crear hilos y comentar</div>
                    <div class="feature">💬 <strong>Mensajes</strong> - Enviar mensajes privados con tus amigos scouts</div>
                    <div class="feature">📸 <strong>Galería</strong> - Ver y compartir fotos de actividades</div>
                  </div>
                  
                  <div style="text-align: center;">
                    <a href="${verificationUrl}" class="button">Verificar mi email</a>
                  </div>
                  
                  <p style="margin-top: 20px; font-size: 14px; color: #666;">
                    Si no podés hacer clic en el botón, copiá y pegá este enlace en tu navegador:<br>
                    <code style="background: #eee; padding: 5px 10px; border-radius: 3px; display: inline-block; margin-top: 10px;">${verificationUrl}</code>
                  </p>
                  
                  <p style="margin-top: 20px; font-size: 12px; color: #999;">
                    Este enlace expira en 24 horas. Si no solicitaste este email, podés ignorarlo.
                  </p>
                </div>
                <div class="footer">
                  <p>Grupo Scout - Siempre Listo ⚜️</p>
                </div>
              </div>
            </body>
          </html>
        `,
      }),
    })

    if (!emailRes.ok) {
      const error = await emailRes.text()
      throw new Error(`Error enviando email: ${error}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email de verificación enviado correctamente' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const message = (error as any)?.message || 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
