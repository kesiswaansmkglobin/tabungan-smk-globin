import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Input validation schema for wali_kelas
const waliKelasSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }).max(255, { message: "Email too long" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).max(100, { message: "Password too long" }),
  full_name: z.string().trim().min(3, { message: "Name must be at least 3 characters" }).max(100, { message: "Name too long" }),
  kelas_id: z.string().uuid({ message: "Invalid class ID format" }),
  nama: z.string().trim().min(3, { message: "Nama must be at least 3 characters" }).max(100, { message: "Nama too long" }),
  nip: z.string().trim().max(50, { message: "NIP too long" }).optional(),
  role: z.literal('wali_kelas').optional()
})

// Input validation schema for staff
const staffSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }).max(255, { message: "Email too long" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).max(100, { message: "Password too long" }),
  full_name: z.string().trim().min(3, { message: "Name must be at least 3 characters" }).max(100, { message: "Name too long" }),
  role: z.literal('staff')
})

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

    // Parse request body
    const body = await req.json()
    
    // Determine if this is a staff or wali_kelas creation
    const isStaff = body.role === 'staff'
    
    // Validate based on role type
    const validationResult = isStaff 
      ? staffSchema.safeParse(body)
      : waliKelasSchema.safeParse(body)

    if (!validationResult.success) {
      console.error('Input validation failed:', validationResult.error)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid input data',
          details: validationResult.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    const { email, password, full_name } = validationResult.data
    const targetRole = isStaff ? 'staff' : 'wali_kelas'
    
    // For wali_kelas, extract additional fields
    const waliKelasData = !isStaff ? validationResult.data as z.infer<typeof waliKelasSchema> : null

    console.log('Creating user with validated data:', { email, full_name, role: targetRole })

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingUser.users.find(u => u.email === email)

    let userId
    
    if (userExists) {
      console.log('User already exists, using existing user:', userExists.id)
      userId = userExists.id
      
      // Update existing profile
      const { error: profileUpdateError } = await supabaseAdmin
        .from('profiles')
        .update({ 
          role: targetRole,
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
        email_confirm: true,
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
          role: targetRole,
          full_name: full_name,
          email: email
        })
        .eq('id', userId)

      if (profileError) {
        throw profileError
      }
    }

    // Only create wali_kelas record if not staff
    if (!isStaff && waliKelasData) {
      const { kelas_id, nama, nip } = waliKelasData
      
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
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: userId,
        message: `${isStaff ? 'Staff' : 'Wali kelas'} created/updated successfully`
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