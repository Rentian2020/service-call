import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "../hooks/useAppContext";
import { useAuth } from "../hooks/useAuth";

export const Chat = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { conversations, messages, sendMessage } = useAppContext();
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const conv = conversations.find((c) => c.id === conversationId);
  const convMessages = conversationId ? (messages[conversationId] ?? []) : [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [convMessages]);

  const handleSend = () => {
    if (!input.trim() || !conversationId || !user) return;
    sendMessage(conversationId, user.uid, user.displayName ?? "You", input.trim());
    setInput("");
    inputRef.current?.focus();
  };

  if (!conv) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-3xl mb-3">💬</p>
          <p className="font-bold text-gray-600">Conversation not found</p>
          <button onClick={() => navigate("/messages")} className="mt-3 text-blue-500 text-sm font-semibold">
            Back to Messages
          </button>
        </div>
      </div>
    );
  }

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 safe-top pb-3 flex items-center gap-3 shadow-sm flex-shrink-0">
        <button
          onClick={() => navigate("/messages")}
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors flex-shrink-0"
        >
          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <img src={conv.providerImage} alt={conv.providerName} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-black text-gray-900 truncate">{conv.providerName}</h2>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
            <p className="text-xs text-emerald-500 font-semibold">Active</p>
          </div>
        </div>
        <button
          onClick={() => navigate(`/provider/${conv.providerId}`)}
          className="text-xs font-bold text-blue-500 px-3 py-1.5 bg-blue-50 rounded-xl active:bg-blue-100"
        >
          Profile
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {convMessages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-3xl mb-3">👋</p>
            <p className="text-sm font-semibold text-gray-500">Say hello to {conv.providerName}</p>
            <p className="text-xs text-gray-400 mt-1">They'll respond as soon as possible.</p>
          </div>
        )}
        {convMessages.map((msg) => {
          const isMe = user ? msg.senderId === user.uid : false;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              {!isMe && (
                <img src={conv.providerImage} alt="" className="w-7 h-7 rounded-full object-cover mr-2 self-end flex-shrink-0" />
              )}
              <div className={`max-w-[72%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMe
                    ? "bg-blue-500 text-white rounded-br-sm"
                    : "bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-sm"
                }`}>
                  <p>{msg.text}</p>
                </div>
                <p className={`text-[10px] ${isMe ? "text-gray-400 text-right" : "text-gray-400"}`}>
                  {formatTime(msg.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-100 px-4 py-3 safe-bottom flex items-end gap-2 flex-shrink-0">
        {!user ? (
          <p className="text-xs text-gray-400 text-center w-full py-2">Sign in to send messages</p>
        ) : (
          <>
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus-within:border-blue-300 focus-within:bg-white transition-colors min-h-[44px] flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type a message…"
                className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                input.trim()
                  ? "bg-blue-500 shadow-md shadow-blue-200 active:scale-95"
                  : "bg-gray-100"
              }`}
            >
              <svg className={`w-4 h-4 ${input.trim() ? "text-white" : "text-gray-400"}`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
