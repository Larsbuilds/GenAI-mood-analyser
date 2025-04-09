from transformers import T5Tokenizer, T5ForConditionalGeneration

def test_t5():
    # Load the model and tokenizer
    model_name = "t5-small"
    tokenizer = T5Tokenizer.from_pretrained(model_name)
    model = T5ForConditionalGeneration.from_pretrained(model_name)
    
    # Prepare input
    input_text = "translate English to German: The house is wonderful."
    input_ids = tokenizer(input_text, return_tensors="pt").input_ids
    
    # Generate output
    outputs = model.generate(input_ids)
    decoded = tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    print("Translation:", decoded)

if __name__ == "__main__":
    test_t5() 