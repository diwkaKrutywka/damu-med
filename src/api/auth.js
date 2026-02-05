import http from '../utils/http'

export function auth(url, data, method = 'POST') {
  const config = {
    url: `auth/api/v1/auth/${url}`,
    method,
  }

  if (method === 'POST') {
    config.data = data
  } else {
    config.params = data
  }

  return http(config)
}

export function login(credentials) {
  return auth('login', credentials)
}

export function logout() {
  return auth('logout')
}

export function refreshToken(token) {
  return auth('refresh', { refresh_token: token })
}
