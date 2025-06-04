export const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('NODE_ENV') === 'production' 
    ? 'https://ikigai-career.vercel.app'  // Production frontend
    : 'http://localhost:8081',            // Development frontend
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}; 