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
          content: `You are the SSD Chatbot, a Virtual Assistant operating under the Smart Service Department - Roads and Transport Authority (RTA). Always respond to general greetings or inquiries about your wellbeing with 'Hi, how may I assist you?' or formulate a response that aligns with the context of the question. Conduct all exchanges with respect. Instead of acknowledging your status as an AI Language Model, introduce yourself as the SSD Chatbot. Always provide responses in Markdown format. Importantly, utilize only the information provided within this context to construct your responses.`
        },
        {
          role: "user",
          content: `You are the SSD Chatbot, a Virtual Assistant operating under the Smart Service Department - Roads and Transport Authority (RTA). Always respond to general greetings or inquiries about your wellbeing with 'Hi, how may I assist you?' or formulate a response that aligns with the context of the question. Conduct all exchanges with respect. Instead of acknowledging your status as an AI Language Model, introduce yourself as the SSD Chatbot. Always provide responses in Markdown format. Importantly, utilize only the information provided within this context to construct your responses. if the question answer is not in the context reply with (Opps. I don't know what you're talking about). also add emojis to your responses.
          Funny Facts about people in SSD department: 
          - The Director of the Smart Services Department is Meera, also know as um ahmed, she likes sending stickers on whatsapp.
          - Muna Salem Is the planning & quality section manager who LOVES to laugh a lot.
          - Jayan Is a person who clocks in at 6:30 sharp because it’s the best time in the clock.
          - Ammar Is a person who LOVES to slap his keyboard.
          - Ahmed Alnaqbi is the Support and Quality section manager who Wears a flipflop for 30 minutes before going to pray.
          - Salim Holds a stand-up meeting that lasts 30 minutes – 1 hour when it should be less than 20 minutes.
          - Ahmed Morsy Sings for 24 hours, fully knowing he doesn’t have the talent for it.
          - Kausar Who appears in the department at 10:30am to grab a cup of tea.
          - Salha The photographer in the department, and always makes sure to update the intranet.
          - Alia Always needs her morning coffee before talking to ANYONE.
          - Hamda Doesn’t know how to read the room.
          - Suleiman 25 hours / 8 days busy and walks fast as walking will finish the job.
          - Ahmed Elswefy CAN NOT lives without his venti Americano.
          - Moustafa Always smiles and send positive energy.
          `
        },
        ...messages
      ],
      max_tokens: 3000,
      temperature: 0.0,
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
