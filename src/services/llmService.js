export async function evaluateAnswer(profile, question, userAnswer, onChunk) {
  const systemPrompt = `Evaluate the user's answer for correctness AND politeness/social appropriateness. You are currently giving feedback to ${profile.name}, who is ${profile.age} years old. They like to ${profile.likes}. Their strengths include ${profile.strengths}. They want to improve on ${profile.improve}.

Please acknowledge and incorporate this information about them into your responses to make them more personalized and relevant.

Your response MUST ALWAYS start with either the exact word 'Correct' or the exact word 'Incorrect'. If the user's answer is rude, uses profanity, demands something, or is impolite in any way, start your response with 'Incorrect'. Only start with 'Correct' if the answer is both factually correct AND polite. After stating Correct/Incorrect, explain why the answer is correct or incorrect. Be supportive, point out strengths, and gently suggest improvements. IMPORTANT: Always provide 1 or 2 specific, quoted examples of what a perfect, polite response would sound like for this scenario. Introduce them clearly (e.g., 'Here is a great way to respond:' or 'Another polite way to say this would be:'). This gives the user a concrete script to learn from. Do not ask follow-up questions, the user cannot interact with you. YOU MUST ALWAYS address the user as 'You' and use a friendly, encouraging tone. Also give a letter grade for the answer (A, B, C, D, or F). If the answer is correct and polite, give an A. If it is incorrect but polite, give a B or C depending on how close it was to being correct. If it is rude or impolite, give a D or F depending on how rude it was. If the answer was left blank, then mark the answer as 'Incorrect', but DO NOT suggest that the user try again or retry the question. There is a strict 60-second timer for each question to simulate real-world time pressure in conversations. Spelling or grammatical mistakes may occur because the timer can end before the user fully completes their response. Do not penalize the user for any kind of spelling or grammatical errors caused by this timer constraint. The user may choose to speak their answer out loud, which may lead to repetition or filler words in their response. Do not penalize the user for any repetition or filler words caused by this.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Question: ${question}\nUser's Answer: ${userAnswer}` }
  ];

  const payload = {
    messages,
    stream: true,
    stop: ["<|im_end|>", "<im_start>", "<im_end>", "<|im_start|>", "<|fim_end|>", "<fim_start|>", "|<|im_end|", "<|im_end", "|<|im_end|"],
    model: "meta/llama-3.3-70b-instruct",
    temperature: 0.7,
    max_tokens: 500
  };

  let isCorrect = false;

  try {
    const response = await fetch("/api/nvidia/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer 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`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.trim() === '' || line.trim() === 'data: [DONE]') continue;
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.substring(6));
            if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
              const token = data.choices[0].delta.content;
              fullResponse += token;
              onChunk(token, fullResponse);
            }
          } catch (e) {
            console.error("Error parsing JSON chunk", e);
          }
        }
      }
    }

    if (fullResponse.trim().startsWith("Correct")) {
      isCorrect = true;
    }
    
    return { isCorrect, fullResponse };

  } catch (error) {
    console.error("Error evaluating answer:", error);
    onChunk(`\nError: could not contact model. ${error.message}`, `Error: could not contact model. ${error.message}`);
    return { isCorrect: false, fullResponse: `Error: could not contact model. ${error.message}` };
  }
}
