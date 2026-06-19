import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini if key exists
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, topic, difficulty, history, text, prompt } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    // Try executing Gemini, fallback to mock responses if key is missing or calls fail
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        if (action === 'flashcards') {
          const genPrompt = `Generate exactly 5 educational flashcards for the topic: "${topic}". 
            Format the response as a JSON array where each object has "front" (the question or concept) and "back" (the answer or definition). 
            Do not wrap the JSON in markdown code blocks or add extra explanation. Return ONLY the raw JSON.`;
          
          const result = await model.generateContent(genPrompt);
          const responseText = result.response.text().trim();
          const cleanJson = responseText.replace(/^```json\s*/, '').replace(/```$/, '').trim();
          const flashcards = JSON.parse(cleanJson);
          return NextResponse.json({ success: true, data: flashcards });
        }

        if (action === 'quiz') {
          const genPrompt = `Generate a multiple-choice quiz with 5 questions on the topic: "${topic}" with difficulty: "${difficulty || 'Medium'}". 
            Format the response as a JSON array where each object has:
            - "question" (string)
            - "options" (array of exactly 4 strings)
            - "answerIndex" (integer 0 to 3 representing the correct option)
            - "explanation" (string explaining why that option is correct)
            Do not wrap the JSON in markdown code blocks. Return ONLY the raw JSON.`;
          
          const result = await model.generateContent(genPrompt);
          const responseText = result.response.text().trim();
          const cleanJson = responseText.replace(/^```json\s*/, '').replace(/```$/, '').trim();
          const quiz = JSON.parse(cleanJson);
          return NextResponse.json({ success: true, data: quiz });
        }

        if (action === 'mindmap') {
          const genPrompt = `Generate a structured hierarchical mindmap for the concept: "${topic}". 
            Format the response as a single JSON object representing the root node. The object must have:
            - "name" (the title of the concept, keep it short)
            - "children" (an array of sub-concepts, where each sub-concept has "name" and optional "children" array of grandchildren)
            Include exactly 3-4 children at the root, and 2-3 grandchildren under each child.
            Do not wrap the JSON in markdown code blocks. Return ONLY the raw JSON structure.`;
          
          const result = await model.generateContent(genPrompt);
          const responseText = result.response.text().trim();
          const cleanJson = responseText.replace(/^```json\s*/, '').replace(/```$/, '').trim();
          const mindmap = JSON.parse(cleanJson);
          return NextResponse.json({ success: true, data: mindmap });
        }

        if (action === 'chat') {
          // Format chat history for Gemini API
          const chatSession = model.startChat({
            history: (history || []).map((msg: any) => ({
              role: msg.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: msg.content }]
            })),
          });
          
          const chatPrompt = prompt || `Let's discuss the topic: "${topic}". Tell me something interesting about it.`;
          const result = await chatSession.sendMessage(chatPrompt);
          const chatReply = result.response.text();
          return NextResponse.json({ success: true, data: chatReply });
        }

        if (action === 'note-enhance') {
          const genPrompt = `You are an AI study assistant. The student wants to improve their study notes:
            "${text}"
            Perform the following task: "${prompt || 'Enhance readability, fix mistakes, and add formatting'}"
            Return the enhanced note formatting inside clean Markdown structure.`;
          
          const result = await model.generateContent(genPrompt);
          return NextResponse.json({ success: true, data: result.response.text() });
        }
      } catch (err: any) {
        console.error('Gemini API call failed, falling back to mock:', err);
      }
    }

    // ==========================================
    // MOCK FALLBACKS (Guarantees usability without key)
    // ==========================================
    const normalizedTopic = (topic || '').toLowerCase();

    if (action === 'flashcards') {
      const mockCards = [
        { front: `What is the core concept of ${topic || 'this topic'}?`, back: `It is the foundational system or theory governing study of ${topic || 'this subject'}.` },
        { front: `Explain a primary application of ${topic || 'this topic'}.`, back: `It is widely used in problem solving, academic research, and engineering design.` },
        { front: `Name a common pitfall or misconception when studying ${topic || 'this topic'}.`, back: `Confusing the base mechanisms with advanced configurations, leading to computational errors.` },
        { front: `What is the historical background of ${topic || 'this topic'}?`, back: `Developed in the mid-20th century to solve complex resource allocation and computational challenges.` },
        { front: `State one key advantage of masterfully applying ${topic || 'this topic'}.`, back: `Significantly enhances reasoning capacity, efficiency, and project scalability.` }
      ];
      return NextResponse.json({ success: true, data: mockCards });
    }

    if (action === 'quiz') {
      const mockQuiz = [
        {
          question: `Which of the following best defines the primary purpose of ${topic || 'this topic'}?`,
          options: [
            `Standardizing database transactions`,
            `Enhancing structural efficiency and reasoning`,
            `Restricting multi-threaded processes`,
            `Replacing client-side rendering engines`
          ],
          answerIndex: 1,
          explanation: `Enhancing structural efficiency and reasoning is the primary conceptual benefit of mastering ${topic || 'this topic'}.`
        },
        {
          question: `In what scenario is ${topic || 'this topic'} least effective?`,
          options: [
            `Highly volatile and unmapped fields`,
            `Deterministic math calculations`,
            `Standard business workflows`,
            `Simple static site compilation`
          ],
          answerIndex: 3,
          explanation: `Static site compilation is simple and does not require complex frameworks associated with ${topic || 'this topic'}.`
        },
        {
          question: `Who is credited with the initial formulation of ${topic || 'this topic'}?`,
          options: [
            `Alan Turing & Grace Hopper`,
            `Guido van Rossum`,
            `A community of global researchers`,
            `Linus Torvalds`
          ],
          answerIndex: 2,
          explanation: `${topic || 'This field'} was pioneered by a wide, collaborative net of researchers over several decades.`
        },
        {
          question: `What is the secondary component required to initialize ${topic || 'this concept'}?`,
          options: [
            `A fast network loop`,
            `Consistent state parameter`,
            `A styling framework`,
            `A secure auth token`
          ],
          answerIndex: 1,
          explanation: `Consistent state parameters are vital for tracking inputs and producing predictable outputs.`
        },
        {
          question: `What is a common metric used to evaluate performance in ${topic || 'this topic'}?`,
          options: [
            `B-Factor score`,
            `F1-Score / Accuracy percentage`,
            `CSS load time`,
            `Vapi voice latency`
          ],
          answerIndex: 1,
          explanation: `Accuracy percentage or F1-scores represent standard evaluation measures for cognitive validation.`
        }
      ];
      return NextResponse.json({ success: true, data: mockQuiz });
    }

    if (action === 'mindmap') {
      const mockMap = {
        name: topic || 'Core Topic',
        children: [
          {
            name: 'Foundations',
            children: [
              { name: 'Core Terminology' },
              { name: 'Basic Principles' },
              { name: 'Prerequisite Skills' }
            ]
          },
          {
            name: 'Key Methodologies',
            children: [
              { name: 'Analytical Processes' },
              { name: 'Implementation Models' },
              { name: 'Optimization Paths' }
            ]
          },
          {
            name: 'Practical Applications',
            children: [
              { name: 'Industry Use Cases' },
              { name: 'Theoretical Research' },
              { name: 'Future Horizons' }
            ]
          }
        ]
      };
      return NextResponse.json({ success: true, data: mockMap });
    }

    if (action === 'chat') {
      const chatPrompt = prompt || '';
      const reply = `I'm your AI Study Companion. Let's study **${topic || 'your chosen subject'}**! 
      
Regarding your query: "${chatPrompt}", it represents a fundamental part of the curriculum. In our studies, we focus on:
1. Understanding the **underlying structure** and constraints.
2. Applying analytical methods to solve **real-world problems**.
3. Practicing with flashcards and quizzes to strengthen **active recall**.

What specific questions do you have about this? I can explain key terms or generate examples for you!`;
      return NextResponse.json({ success: true, data: reply });
    }

    if (action === 'note-enhance') {
      const enhanced = `# Enhanced Study Notes: ${topic || 'Concept Overview'}

## Summary
${text || 'No text provided. Please enter some notes to enhance.'}

---
### AI Key Takeaways
- **Concept Clarity**: Focus on identifying core rules and edge cases.
- **Structured Reference**: Keep equations, vocabulary, and code snippets highlighted.
- **Further Study**: Combine these notes with a mindmap for visual retention.

*Notes enhanced by StudyFlow AI Companion.*`;
      return NextResponse.json({ success: true, data: enhanced });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
