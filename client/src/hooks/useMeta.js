import { useEffect, useState } from 'react';
import { api } from '../api/client';

let cache = null;

// Categories and dosage forms from the server (fetched once)
export default function useMeta() {
  const [meta, setMeta] = useState(cache || { categories: [], dosageForms: [] });

  useEffect(() => {
    if (cache) return;
    api('/medicines/meta')
      .then((data) => {
        cache = data;
        setMeta(data);
      })
      .catch(() => {});
  }, []);

  return meta;
}
