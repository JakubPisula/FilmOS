import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const sendEvent = (data: any) => {
        const eventData = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(eventData));
      };

      // In a real scenario, we would subscribe to a message queue or use a global event emitter
      // For demo purposes, we send a "Connected" event
      sendEvent({ type: "system", message: "SSE Connected" });

      // Example of periodic message
      const interval = setInterval(() => {
        // sendEvent({ type: "sync", message: `System heartbeat at ${new Date().toLocaleTimeString()}` });
      }, 30000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
