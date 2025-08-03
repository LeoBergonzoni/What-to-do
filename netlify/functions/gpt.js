const fetch = require("node-fetch");

exports.handler = async function(event) {
  const { prompt } = JSON.parse(event.body || '{}');
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "API key not found in environment variables." })
    };
  }

  if (!prompt) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing prompt." })
    };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4", // o "gpt-3.5-turbo"
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8
      })
    });

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify({ response: data.choices?.[0]?.message?.content || "" })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};