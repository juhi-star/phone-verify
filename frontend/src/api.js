const REQUEST_TIMEOUT = 15000

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export async function api(endpoint, method = 'GET', body = null, token = null) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

  try {
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(`/api${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
      signal: controller.signal,
    })

    let data
    try {
      data = await res.json()
    } catch {
      throw new ApiError('Unexpected server response', res.status)
    }

    if (!res.ok) {
      throw new ApiError(data.message || `Request failed with status ${res.status}`, res.status, data)
    }

    return data
  } catch (err) {
    if (err instanceof ApiError) throw err
    if (err.name === 'AbortError') {
      throw new ApiError('Request timed out. Please try again.', 408)
    }
    throw new ApiError('Network error. Is the server running?', 0)
  } finally {
    clearTimeout(timeout)
  }
}
