import whisper

def test_whisper():
    # Load the model
    model = whisper.load_model("base")
    
    # Transcribe audio
    result = model.transcribe("test_audio.mp3")  # You'll need to provide an audio file
    print(result["text"])

if __name__ == "__main__":
    test_whisper() 