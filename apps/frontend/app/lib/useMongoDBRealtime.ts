import { useState, useEffect } from 'react';
import { RouterResponseWithId, RouterResponseWithIdSchema } from './types';

export function useMongoDBRealtime() {
  const [data, setData] = useState<RouterResponseWithId[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const eventSource = new EventSource('/api/router-responses-stream');

    eventSource.onopen = () => {
      console.log('SSE connection opened');
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const newData = JSON.parse(event.data);

        const parsedData = newData.map((item: RouterResponseWithId) =>
          RouterResponseWithIdSchema.parse(item),
        );

        console.log(parsedData);

        setData(parsedData);
      } catch (err) {
        console.error('Error parsing SSE data:', err);
        setError('Error parsing data');
      }
    };

    eventSource.onerror = () => {
      console.error('SSE connection error');
      setIsConnected(false);
      setError('Connection error');
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return { data, isConnected, error };
}
