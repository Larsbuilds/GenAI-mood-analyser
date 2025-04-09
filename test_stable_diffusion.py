from diffusers import StableDiffusionPipeline
import torch

def test_stable_diffusion():
    # Load the pipeline
    model_id = "runwayml/stable-diffusion-v1-5"
    pipe = StableDiffusionPipeline.from_pretrained(model_id, torch_dtype=torch.float16)
    
    # Move to GPU if available
    if torch.cuda.is_available():
        pipe = pipe.to("cuda")
    
    # Generate an image
    prompt = "a beautiful sunset over a mountain landscape, digital art"
    image = pipe(prompt).images[0]
    
    # Save the image
    image.save("test_output.png")
    print("Image generated successfully! Check test_output.png")

if __name__ == "__main__":
    test_stable_diffusion() 