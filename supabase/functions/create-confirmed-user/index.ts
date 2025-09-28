import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Create a Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify the user making the request is an admin
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Invalid authentication')
    }

    // Check if user is admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      throw new Error('Only admins can create confirmed users')
    }

    const { email, password, full_name, kelas_id, nama, nip } = await req.json()

    console.log('Creating user with data:', { email, full_name, kelas_id, nama, nip })

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingUser.users.find(u => u.email === email)

    let userId
    
    if (userExists) {
      console.log('User already exists, using existing user:', userExists.id)
      userId = userExists.id
      
      // Update existing profile if needed
      const { error: profileUpdateError } = await supabaseAdmin
        .from('profiles')
        .update({ 
          role: 'wali_kelas',
          full_name: full_name,
          email: email
        })
        .eq('id', userId)

      if (profileUpdateError) {
        console.error('Error updating profile:', profileUpdateError)
      }
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true, // This auto-confirms the email
        user_metadata: {
          full_name: full_name
        }
      })

      if (createError) {
        throw createError
      }

      userId = newUser.user.id

      // Update the profile with the correct role
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ 
          role: 'wali_kelas',
          full_name: full_name,
          email: email
        })
        .eq('id', userId)

      if (profileError) {
        throw profileError
      }
    }

    // Check if wali_kelas record already exists
    const { data: existingWaliKelas } = await supabaseAdmin
      .from('wali_kelas')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (!existingWaliKelas) {
      // Create wali_kelas record
      const { error: waliKelasError } = await supabaseAdmin
        .from('wali_kelas')
        .insert({
          user_id: userId,
          kelas_id: kelas_id,
          nama: nama,
          nip: nip || null
        })

      if (waliKelasError) {
        console.error('Error creating wali_kelas record:', waliKelasError)
        throw waliKelasError
      }
    } else {
      // Update existing wali_kelas record
      const { error: waliKelasUpdateError } = await supabaseAdmin
        .from('wali_kelas')
        .update({
          kelas_id: kelas_id,
          nama: nama,
          nip: nip || null
        })
        .eq('user_id', userId)

      if (waliKelasUpdateError) {
        console.error('Error updating wali_kelas record:', waliKelasUpdateError)
        throw waliKelasUpdateError
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: userId,
        message: 'Wali kelas created/updated successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error creating confirmed user:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})