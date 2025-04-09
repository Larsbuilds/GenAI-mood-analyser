# Stable Diffusion MCP Service

This service provides image generation capabilities using Stable Diffusion v1.4.

## Setup

1. Ensure you have Python 3.8+ installed
2. Install dependencies:
   ```bash
   pip install fastapi uvicorn torch diffusers transformers accelerate safetensors
   ```

## Running the Service

Start the server by running:
```bash
python server.py
```

The server will start on http://localhost:7861

## API

The service exposes two endpoints:

1. SSE Status Endpoint (GET /)
   - Provides real-time status updates about the service
   - Returns service health and available tools

2. Image Generation Endpoint (POST /)
   - JSON-RPC endpoint for generating images
   - Method: `generate_image`
   - Parameters:
     - `prompt` (string, required): Text prompt to generate an image from
     - `negative_prompt` (string, optional): Text prompt that the image should not contain
     - `steps` (integer, optional, default: 15): Number of inference steps
     - `width` (integer, optional, default: 512): Width of the generated image
     - `height` (integer, optional, default: 512): Height of the generated image

## Example Usage

```python
# Generate an image
{
    "jsonrpc": "2.0",
    "method": "generate_image",
    "params": {
        "prompt": "a beautiful sunset over mountains",
        "steps": 15,
        "width": 512,
        "height": 512
    },
    "id": "1"
}
``` 