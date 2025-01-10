import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { fields, rowCount } = await req.json();

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
          content: `Generate a fake dataset with the following fields: ${fields.join(', ')}. I want ${rowCount} rows of fake data. Return it as a JSON array.`
        }]
      })
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse the generated content as JSON
    let parsedData;
    try {
      parsedData = JSON.parse(content);
    } catch (e) {
      // If parsing fails, try to extract JSON from the text
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse generated data');
      }
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