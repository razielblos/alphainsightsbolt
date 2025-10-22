'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Loader, User, Bot, BarChart3 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.content }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setUploadStatus('Erro: Apenas arquivos CSV são permitidos.');
      return;
    }

    setUploadStatus('Enviando arquivo...');
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setUploadStatus(`Sucesso: ${data.message}`);

      const uploadMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Arquivo "${file.name}" foi carregado com sucesso. ${data.message}`,
      };
      setMessages((prev) => [...prev, uploadMessage]);

      setTimeout(() => setUploadStatus(''), 3000);
    } catch (error) {
      setUploadStatus('Erro ao enviar arquivo. Tente novamente.');
      setTimeout(() => setUploadStatus(''), 3000);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatMessageContent = (content: string) => {
    const parts = content.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a]">
      <header className="flex items-center justify-center px-6 py-4 border-b border-gray-800/50 backdrop-blur-sm bg-[#0a0a0a]/80 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-blue-500" />
          <h1 className="text-xl font-semibold text-gray-100">Alpha Insights</h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
              <BarChart3 className="w-16 h-16 text-blue-500 mb-4" />
              <h2 className="text-2xl font-semibold text-gray-100 mb-2">
                Bem-vindo ao Alpha Insights
              </h2>
              <p className="text-gray-400 max-w-md">
                Seu assistente de IA para análise de dados de vendas. Faça perguntas sobre seus dados ou carregue um arquivo CSV para começar.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 chat-message-enter ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}

              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#1a1a1a] text-gray-100 border border-gray-800'
                }`}
              >
                <div className="prose prose-invert max-w-none">
                  {formatMessageContent(message.content)}
                </div>
              </div>

              {message.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-200" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 chat-message-enter">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl px-4 py-3">
                <Loader className="w-5 h-5 text-blue-500 animate-spin" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="border-t border-gray-800/50 bg-[#0a0a0a]/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          {uploadStatus && (
            <div className="mb-3 px-4 py-2 rounded-lg bg-[#1a1a1a] border border-gray-800 text-sm text-gray-300">
              {uploadStatus}
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex items-end gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite sua pergunta sobre os dados..."
                disabled={isLoading}
                className="w-full px-5 py-3.5 pr-12 rounded-full bg-[#1a1a1a] border border-gray-800 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Anexar arquivo CSV"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 p-3.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-[#0a0a0a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
              aria-label="Enviar mensagem"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </footer>
    </div>
  );
}
