stage1_results = [
    {
        "model": "openai/gpt-5.1",
        "response": "The answer is 42."
    },
    {
        "model": "google/gemini-3-pro-preview",
        "response": "The answer is 42."
    },
    {
        "model": "anthropic/claude-sonnet-4.5",
        "response": "The answer is 42."
    }, {
        "model": "x-ai/grok-4",
        "response": "The answer is 42."
    }
]
labels = [chr(65 + i) for i in range(len(stage1_results))] 
print(labels)

label_to_model = {
    f"Response {label}": result['model']
    for label, result in zip(labels, stage1_results)
}
print(label_to_model)