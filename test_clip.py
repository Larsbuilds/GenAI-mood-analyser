import clip
import torch
from PIL import Image

def test_clip():
    # Load the model
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model, preprocess = clip.load("ViT-B/32", device=device)
    
    # Prepare inputs
    image = preprocess(Image.open("test_image.jpg")).unsqueeze(0).to(device)  # You'll need to provide an image
    text = clip.tokenize(["a dog", "a cat", "a bird"]).to(device)
    
    # Calculate features
    with torch.no_grad():
        image_features = model.encode_image(image)
        text_features = model.encode_text(text)
        
        # Calculate similarity
        logits_per_image, logits_per_text = model(image, text)
        probs = logits_per_image.softmax(dim=-1).cpu().numpy()
    
    print("Label probs:", probs)

if __name__ == "__main__":
    test_clip() 