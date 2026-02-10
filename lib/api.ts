/**
 * Client-side fetch utility for API calls
 * Handles authentication automatically via NextAuth session
 */

/**
 * Fetch data from API with automatic session handling
 * Use this for all API calls instead of bare fetch()
 */
export async function apiCall<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string; status: number }> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Include cookies with NextAuth session
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        error: data.message || data.error || 'Request failed',
        status: response.status,
      }
    }

    return {
      data,
      status: response.status,
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Network error',
      status: 0,
    }
  }
}

/**
 * GET request to API
 */
export function apiGet<T = any>(url: string) {
  return apiCall<T>(url, { method: 'GET' })
}

/**
 * POST request to API
 */
export function apiPost<T = any>(url: string, body: any) {
  return apiCall<T>(url, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/**
 * PUT request to API
 */
export function apiPut<T = any>(url: string, body: any) {
  return apiCall<T>(url, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

/**
 * DELETE request to API
 */
export function apiDelete<T = any>(url: string) {
  return apiCall<T>(url, { method: 'DELETE' })
}

/**
 * PATCH request to API
 */
export function apiPatch<T = any>(url: string, body: any) {
  return apiCall<T>(url, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}
