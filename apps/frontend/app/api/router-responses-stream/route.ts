import { MongoClient } from 'mongodb';
import { NextRequest } from 'next/server';

const COLLECTION_ROUTER_RESPONSE_FRIENDLY = 'router_response_friendly';

export async function GET(request: NextRequest) {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return new Response('MONGODB_URI not configured', { status: 500 });
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();
    const collection = db.collection(COLLECTION_ROUTER_RESPONSE_FRIENDLY);

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        // Send all existing documents first
        try {
          const allDocs = await collection.find({}).toArray();
          const data = `data: ${JSON.stringify(allDocs)}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch (error) {
          console.error('Error fetching initial documents:', error);
        }

        // Watch for any changes to the collection
        const changeStream = collection.watch();

        changeStream.on('change', async () => {
          try {
            // Fetch all documents again when anything changes
            const allDocs = await collection.find({}).toArray();
            const data = `data: ${JSON.stringify(allDocs)}\n\n`;
            controller.enqueue(encoder.encode(data));
          } catch (error) {
            console.error('Error processing change:', error);
          }
        });

        changeStream.on('error', (error) => {
          console.error('Change stream error:', error);
          controller.close();
        });

        // Cleanup on disconnect
        request.signal?.addEventListener('abort', () => {
          changeStream.close();
          client.close();
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return new Response('Database connection failed', { status: 500 });
  }
}
