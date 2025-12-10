'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Terminal, CheckCircle2, Circle, Loader2, Sparkles } from 'lucide-react';
import { streamChat, ChatEvent } from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import clsx from 'clsx';

interface Task {
    id: number;
    description: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    subtasks: SubTask[];
}

interface SubTask {
    id: number;
    description: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    tasks?: Task[];
}

export default function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentTasks, setCurrentTasks] = useState<Task[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, currentTasks]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isProcessing) return;

        const query = input;
        setInput('');
        setIsProcessing(true);
        setCurrentTasks([]);

        // Add user message
        const userMsgId = Date.now().toString();
        setMessages(prev => [...prev, { id: userMsgId, role: 'user', content: query }]);

        // Create placeholder for assistant message
        const assistantMsgId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: '' }]);

        try {
            const stream = streamChat(query);

            for await (const event of stream) {
                handleEvent(event, assistantMsgId);
            }
        } catch (err) {
            console.error(err);
            setMessages(prev => prev.map(m =>
                m.id === assistantMsgId ? { ...m, content: 'Error: Failed to connect to Dexter.' } : m
            ));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleEvent = (event: ChatEvent, msgId: string) => {
        switch (event.type) {
            case 'tasks_planned':
                const newTasks = event.data.map((t: any) => ({
                    id: t.id,
                    description: t.description,
                    status: 'pending',
                    subtasks: []
                }));
                setCurrentTasks(newTasks);
                break;

            case 'task_start':
                setCurrentTasks(prev => prev.map(t =>
                    t.id === event.data.taskId ? { ...t, status: 'running' } : t
                ));
                break;

            case 'task_complete':
                setCurrentTasks(prev => prev.map(t =>
                    t.id === event.data.taskId ? { ...t, status: event.data.success ? 'completed' : 'failed' } : t
                ));
                break;

            case 'answer_chunk':
                setMessages(prev => prev.map(m =>
                    m.id === msgId ? { ...m, content: m.content + event.data } : m
                ));
                break;
        }
    };

    return (
        <div className="flex flex-col h-screen max-w-5xl mx-auto p-4 md:p-8">
            {/* Header */}
            <header className="flex items-center gap-3 mb-8">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
                    <Terminal className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                        Dexter
                    </h1>
                    <p className="text-sm text-zinc-400">Financial Research Agent</p>
                </div>
            </header>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto mb-6 space-y-6 pr-2 scrollbar-thin scrollbar-thumb-zinc-800">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                        <Sparkles className="w-12 h-12 text-blue-500/50" />
                        <p className="text-zinc-500">Ask me to analyze stocks, compare financials, or research markets.</p>
                    </div>
                )}

                {messages.map((msg) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={msg.id}
                        className={clsx(
                            "flex gap-4",
                            msg.role === 'user' ? "justify-end" : "justify-start"
                        )}
                    >
                        <div
                            className={clsx(
                                "max-w-[80%] rounded-2xl p-4 shadow-sm",
                                msg.role === 'user'
                                    ? "bg-blue-600 text-white"
                                    : "glass text-zinc-200"
                            )}
                        >
                            <div className="prose prose-invert prose-sm max-w-none">
                                <ReactMarkdown
                                    components={{
                                        // Style links to be blue and underlined
                                        a: ({ node, ...props }) => <a {...props} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer" />
                                    }}
                                >
                                    {msg.content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {/* Task Progress (Only show if processing and has tasks) */}
                <AnimatePresence>
                    {isProcessing && currentTasks.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="glass-card rounded-xl p-4 border-l-4 border-blue-500"
                        >
                            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-blue-400">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Researching...</span>
                            </div>
                            <div className="space-y-2">
                                {currentTasks.map((task) => (
                                    <div key={task.id} className="flex items-center gap-2 text-sm">
                                        {task.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                        {task.status === 'running' && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
                                        {task.status === 'pending' && <Circle className="w-4 h-4 text-zinc-700" />}
                                        {task.status === 'failed' && <Circle className="w-4 h-4 text-red-500" />}

                                        <span className={clsx(
                                            task.status === 'completed' ? "text-zinc-500 line-through" : "text-zinc-300",
                                            task.status === 'running' && "text-blue-200 font-medium"
                                        )}>
                                            {task.description}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="relative">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Research any company or market..."
                    disabled={isProcessing}
                    className="w-full bg-zinc-900/50 text-white placeholder-zinc-500 border border-zinc-800 rounded-2xl py-4 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all shadow-lg backdrop-blur-sm"
                />
                <button
                    type="submit"
                    disabled={!input.trim() || isProcessing}
                    className="absolute right-2 top-2 p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 rounded-xl transition-colors"
                >
                    {isProcessing ? (
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : (
                        <Send className="w-5 h-5 text-white" />
                    )}
                </button>
            </form>
        </div>
    );
}
