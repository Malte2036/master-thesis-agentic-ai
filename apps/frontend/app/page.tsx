import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-xl h-[80vh] bg-white rounded-xl shadow-lg flex flex-col overflow-hidden border border-gray-200">
        {/* Header */}
        <header className="px-6 py-4 border-b border-gray-100 bg-white">
          <h1 className="text-2xl font-bold text-primary">HSD AI Chat</h1>
          <p className="text-gray-500 text-sm mt-1">
            Chat with your university LLM assistant
          </p>
        </header>
        {/* Chat Messages */}
        <main className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-50">
          {/* Example messages */}
          <div className="flex flex-col gap-2">
            <div className="self-start bg-gray-200 text-gray-900 px-4 py-2 rounded-2xl rounded-bl-none max-w-[80%]">
              Hello! How can I help you with your university tasks today?
            </div>
            <div className="self-end bg-primary text-white px-4 py-2 rounded-2xl rounded-br-none max-w-[80%]">
              Show me my upcoming assignments.
            </div>
            <div className="self-start bg-gray-200 text-gray-900 px-4 py-2 rounded-2xl rounded-bl-none max-w-[80%]">
              You have 2 assignments due this week:
              <ul className="list-disc ml-5 mt-1 text-sm">
                <li>Math Homework (due Thursday)</li>
                <li>Design Project (due Friday)</li>
              </ul>
            </div>
          </div>
        </main>
        {/* Input Box */}
        <form className="px-4 py-3 bg-white border-t border-gray-100 flex items-center gap-2">
          <input
            type="text"
            className="flex-1 rounded-full border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 bg-gray-50"
            placeholder="Type your message..."
            disabled
          />
          <button
            type="submit"
            className="bg-primary text-white px-5 py-2 rounded-full font-semibold shadow-sm hover:bg-hsd-red transition-colors disabled:opacity-50"
            disabled
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
