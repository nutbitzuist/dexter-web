import { Hono } from 'hono';
import { streamText } from 'hono/streaming';
import { cors } from 'hono/cors';
import { Agent, AgentCallbacks } from './agent/agent.js';
import { MessageHistory } from './utils/message-history.js';

const app = new Hono();

// Enable CORS for frontend
app.use('/*', cors({
    origin: '*', // For development, allow all. In production, restrict to Vercel domain.
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
}));

interface ChatRequest {
    query: string;
    history?: { role: 'user' | 'assistant'; content: string }[];
    model?: string;
}

app.post('/api/chat', async (c) => {
    const body = await c.req.json<ChatRequest>();
    const { query, history = [], model = 'gpt-4-turbo-preview' } = body;

    return streamText(c, async (stream) => {
        const callbacks: AgentCallbacks = {
            onUserQuery: async (q) => {
                await stream.writeln(JSON.stringify({ type: 'user_query', data: q }));
            },
            onTasksPlanned: async (tasks) => {
                await stream.writeln(JSON.stringify({ type: 'tasks_planned', data: tasks }));
            },
            onSubtasksPlanned: async (subtasks) => {
                await stream.writeln(JSON.stringify({ type: 'subtasks_planned', data: subtasks }));
            },
            onTaskStart: async (taskId) => {
                await stream.writeln(JSON.stringify({ type: 'task_start', data: { taskId } }));
            },
            onTaskComplete: async (taskId, success) => {
                await stream.writeln(JSON.stringify({ type: 'task_complete', data: { taskId, success } }));
            },
            onSubTaskStart: async (taskId, subTaskId) => {
                await stream.writeln(JSON.stringify({ type: 'subtask_start', data: { taskId, subTaskId } }));
            },
            onSubTaskComplete: async (taskId, subTaskId, success) => {
                await stream.writeln(JSON.stringify({ type: 'subtask_complete', data: { taskId, subTaskId, success } }));
            },
            onDebug: async (message) => {
                // Optional: send debug logs
                // await stream.writeln(JSON.stringify({ type: 'debug', data: message }));
            },
            onSpinnerStart: async (message) => {
                await stream.writeln(JSON.stringify({ type: 'spinner_start', data: message }));
            },
            onSpinnerStop: async () => {
                await stream.writeln(JSON.stringify({ type: 'spinner_stop' }));
            },
            onAnswerStream: async (answerStream) => {
                for await (const chunk of answerStream) {
                    await stream.writeln(JSON.stringify({ type: 'answer_chunk', data: chunk }));
                }
            }
        };

        try {
            const agent = new Agent({
                model: model,
                callbacks: callbacks
            });

            // Convert simple history to MessageHistory if needed
            // For now, we rely on the agent to handle the query. 
            // If MessageHistory is complex, we might need to reconstruct it.
            const messageHistory = new MessageHistory();
            // Populate message history if implementation allows...

            await agent.run(query, messageHistory);
            await stream.writeln(JSON.stringify({ type: 'done' }));
        } catch (e: any) {
            await stream.writeln(JSON.stringify({ type: 'error', data: e.message }));
        }
    });
});

const port = process.env.PORT || 3000;
console.log(`Server is running on port ${port}`);

export default {
    port,
    fetch: app.fetch,
};
