import { useState, useEffect } from 'react';
import type { AssetType, AssetTypeSpec } from '@/types/asset';

/**
 * Hook to fetch and cache asset type specifications
 */
export function useAssetTypeSpecs(assetType?: AssetType) {
  const [spec, setSpec] = useState<AssetTypeSpec | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!assetType) {
      setSpec(null);
      return;
    }

    async function fetchSpec() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/asset-types/${assetType}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch asset type specs: ${response.statusText}`);
        }

        const data = await response.json();
        setSpec(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('[useAssetTypeSpecs] Error fetching specs:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSpec();
  }, [assetType]);

  return { spec, loading, error };
}

/**
 * Hook to fetch all asset type specifications
 */
export function useAllAssetTypeSpecs() {
  const [specs, setSpecs] = useState<AssetTypeSpec[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAllSpecs() {
      try {
        const response = await fetch('/api/asset-types');

        if (!response.ok) {
          throw new Error(`Failed to fetch asset types: ${response.statusText}`);
        }

        const data = await response.json();
        setSpecs(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('[useAllAssetTypeSpecs] Error fetching specs:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAllSpecs();
  }, []);

  return { specs, loading, error };
}
