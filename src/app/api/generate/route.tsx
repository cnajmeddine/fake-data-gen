import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt, rowCount } = await req.json();

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3-8b-instruct:extended',
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Try multiple parsing strategies
    let parsedData;
    try {
      // First try: direct JSON parse
      parsedData = JSON.parse(content);
    } catch (e) {
      try {
        // Second try: find JSON array in text
        const jsonMatch = content.match(/\[\s*{[\s\S]*}\s*\]/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        } else {
          // Third try: look for JSON-like structure and clean it
          const cleanedContent = content
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();
          parsedData = JSON.parse(cleanedContent);
        }
      } catch (e2) {
        console.error('Parsing error:', e2);
        console.error('Raw content:', content);
        return NextResponse.json(
          { 
            error: 'Failed to parse generated data',
            rawContent: content 
          },
          { status: 500 }
        );
      }
    }

    if (!Array.isArray(parsedData)) {
      return NextResponse.json(
        { 
          error: 'Generated data is not an array',
          rawContent: content 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(parsedData);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { message: 'Error generating data', error: error.message },
      { status: 500 }
    );
  }
}