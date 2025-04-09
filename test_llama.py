from llama_cpp import Llama

def test_llama():
    # Initialize the model
    llm = Llama(
        model_path="models/llama-2-7b-chat.gguf",  # You'll need to download this
        n_ctx=2048,
        n_threads=4
    )
    
    # Generate text
    output = llm(
        "Q: What is the capital of France? A:",
        max_tokens=32,
        stop=["Q:", "\n"],
        echo=True
    )
    
    print(output["choices"][0]["text"])

if __name__ == "__main__":
    test_llama() 