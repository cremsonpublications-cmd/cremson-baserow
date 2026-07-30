import { NextResponse } from 'next/server';

export const runtime = 'edge';

async function handle(request, { params }) {
  const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
  
  // Reconstruct the full target URL
  const { searchParams } = new URL(request.url);
  const pathParts = params.path || [];
  const targetUrl = new URL(`/api/${pathParts.join('/')}`, backendUrl);
  searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value);
  });

  // Copy request headers
  const headers = new Headers(request.headers);
  // Remove Host header to prevent certificate/routing mismatches
  headers.delete('host');
  
  const options = {
    method: request.method,
    headers,
  };

  // Only read body for methods that allow it
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    try {
      options.body = await request.blob();
    } catch (e) {
      // No body or error reading body
    }
  }

  try {
    const res = await fetch(targetUrl.toString(), options);
    
    // Copy response headers
    const resHeaders = new Headers(res.headers);
    
    return new NextResponse(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: resHeaders,
    });
  } catch (err) {
    console.error('Proxy error:', err);
    return NextResponse.json({ detail: 'Proxy connection to backend failed' }, { status: 502 });
  }
}

export {
  handle as GET,
  handle as POST,
  handle as PUT,
  handle as PATCH,
  handle as DELETE,
  handle as OPTIONS,
  handle as HEAD
};
