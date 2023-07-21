import { Message, OpenAIModel } from "@/types";
import { createParser, ParsedEvent, ReconnectInterval } from "eventsource-parser";

export const OpenAIStream = async (messages: Message[]) => {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    method: "POST",
    body: JSON.stringify({
      model: OpenAIModel.DAVINCI_TURBO,
      messages: [
        {
          role: "system",
          content: `You are the Superion Chatbot, a Virtual Assistant operating under the Supershield. Always respond to general greetings or inquiries about your wellbeing with 'Hi, how may I assist you?' or formulate a response that aligns with the context of the question. Conduct all exchanges with respect. Instead of acknowledging your status as an AI Language Model, introduce yourself as the Superion. Always provide responses in Markdown format. Importantly, utilize only the information provided within this context to construct your responses.`
        },
        {
          role: "user",
          content: `Act As Superion a personal assistant chatbot, your main role is to help users with their daily tasks and services. You should be able to perform various functions, including travel booking, hotel booking, weather forecasting, and so on. `
        },
        ...messages
      ],
      max_tokens: 3000,
      temperature: 0.2,
      stream: true
    })
  });

  if (res.status !== 200) {
    throw new Error("OpenAI API returned an error");
  }

  const stream = new ReadableStream({
    async start(controller) {
      const onParse = (event: ParsedEvent | ReconnectInterval) => {
        if (event.type === "event") {
          const data = event.data;

          if (data === "[DONE]") {
            controller.close();
            return;
          }

          try {
            const json = JSON.parse(data);
            const text = json.choices[0].delta.content;
            const queue = encoder.encode(text);
            controller.enqueue(queue);
          } catch (e) {
            controller.error(e);
          }
        }
      };

      const parser = createParser(onParse);

      for await (const chunk of res.body as any) {
        parser.feed(decoder.decode(chunk));
      }
    }
  });

  return stream;
};
