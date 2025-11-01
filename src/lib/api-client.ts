import type { paths } from '@/types/api';
import { supabase } from './supabase';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/**
 * Fetch with authentication
 */
export async function fetchWithAuth<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  console.log('🔐 [fetchWithAuth] Starting auth check for:', url);
  console.log('🌐 [fetchWithAuth] API_BASE:', API_BASE);

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    console.error('❌ [fetchWithAuth] Session error:', sessionError);
    throw new Error(`Authentication error: ${sessionError.message}`);
  }

  if (!session) {
    console.error('❌ [fetchWithAuth] No session found');
    throw new Error('No active session. Please refresh the page and log in again.');
  }

  const token = session.access_token;
  console.log('🔑 [fetchWithAuth] Token exists:', token.substring(0, 20) + '...');
  console.log('📏 [fetchWithAuth] Token length:', token.length);

  const requestHeaders = {
    ...options.headers,
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,  // Always last to override
  };

  console.log('🔐 [fetchWithAuth] Auth header present:', 'Authorization' in requestHeaders);

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: requestHeaders,
  });

  console.log('📥 [fetchWithAuth] Response status:', response.status);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error('❌ [fetchWithAuth] Request failed:', error);
    throw new Error(error.error || error.message || `Request failed with status ${response.status}`);
  }

  console.log('✅ [fetchWithAuth] Request successful');
  return response.json();
}

/**
 * Type-safe API paths
 */
export type ApiPaths = paths;
