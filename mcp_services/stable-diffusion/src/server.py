from fastapi import FastAPI, HTTPException, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, Literal, List, Union
import base64
from io import BytesIO
from PIL import Image
import json
import asyncio
from sse_starlette.sse import EventSourceResponse
from diffusers import StableDiffusionPipeline
import torch
import logging
import signal
import sys
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing server...")
    initialize_model()
    yield
    # Shutdown
    logger.info("Shutting down server...")

app = FastAPI(lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define MCP tool configuration
MCP_TOOLS = [
    {
        "method": "txt2img",
        "params": {
            "type": "object",
            "properties": {
                "prompt": {"type": "string"},
                "negative_prompt": {"type": "string", "optional": True},
                "width": {"type": "integer", "minimum": 64, "maximum": 2048},
                "height": {"type": "integer", "minimum": 64, "maximum": 2048},
                "num_inference_steps": {"type": "integer", "minimum": 1, "maximum": 150},
                "guidance_scale": {"type": "number", "minimum": 1, "maximum": 20},
                "seed": {"type": "integer", "optional": True}
            },
            "required": ["prompt"]
        }
    }
]

class JsonRpcRequest(BaseModel):
    jsonrpc: Literal["2.0"]
    method: str
    params: Optional[Dict[str, Any]] = None
    id: Optional[str] = None

# Global variable for the pipeline
pipe = None

def initialize_model():
    global pipe
    try:
        logger.info("Loading Stable Diffusion model...")
        pipe = StableDiffusionPipeline.from_pretrained(
            "CompVis/stable-diffusion-v1-4",
            torch_dtype=torch.float32,
            use_safetensors=True,
            low_cpu_mem_usage=True
        ).to('cpu')
        pipe.enable_attention_slicing(slice_size=1)
        logger.info("Model loaded successfully!")
        return True
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}")
        return False

async def status_event_generator(request: Request):
    logger.info("Starting status event generator")
    try:
        # Send handshake response first
        handshake = {
            "jsonrpc": "2.0",
            "id": "0",
            "result": {
                "version": "1.0.0",
                "transport": "sse",
                "name": "stable-diffusion-mcp",
                "status": "ready"
            }
        }
        yield {
            "event": "handshake",
            "retry": 15000,
            "id": "0",
            "data": json.dumps(handshake)
        }
        logger.info("Sent handshake")

        # Send tools list
        tools_message = {
            "jsonrpc": "2.0",
            "id": "1",
            "result": {
                "tools": MCP_TOOLS
            }
        }
        yield {
            "event": "message",
            "retry": 15000,
            "id": "1",
            "data": json.dumps(tools_message)
        }
        logger.info("Sent tools list")

        # Keep connection alive with heartbeat
        message_id = 2
        while True:
            if await request.is_disconnected():
                logger.info("Client disconnected")
                break

            # Send heartbeat
            yield {
                "event": "ping",
                "retry": 15000,
                "id": str(message_id),
                "data": ""
            }
            message_id += 1
            await asyncio.sleep(15)

    except Exception as e:
        logger.error(f"Error in status generator: {str(e)}")
        raise  # Re-raise to ensure proper error handling
    finally:
        logger.info("Status generator finished")

@app.get("/sse")
@app.get("/events")
async def sse_endpoint(request: Request):
    try:
        logger.info(f"SSE connection requested from {request.client.host}:{request.client.port}")
        logger.info(f"Request headers: {dict(request.headers)}")
        
        # Handle preflight OPTIONS request
        if request.method == "OPTIONS":
            return Response(
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, OPTIONS",
                    "Access-Control-Allow-Headers": "*",
                }
            )

        response = EventSourceResponse(
            status_event_generator(request),
            ping=15,
            ping_message_factory=lambda: {
                "event": "ping",
                "id": "0",
                "data": "",
                "retry": 15000
            }
        )
        response.headers.update({
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Content-Type": "text/event-stream",
            "X-Accel-Buffering": "no",
            "Transfer-Encoding": "chunked"
        })
        
        logger.info("Returning SSE response")
        return response
    except Exception as e:
        logger.error(f"Error in SSE endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/txt2img")
async def generate_image(request: Request):
    try:
        data = await request.json()
        
        # Extract parameters with defaults
        prompt = data.get("prompt")
        if not prompt:
            raise ValueError("Prompt is required")
            
        negative_prompt = data.get("negative_prompt", "")
        width = data.get("width", 512)
        height = data.get("height", 512)
        num_inference_steps = data.get("num_inference_steps", 30)
        guidance_scale = data.get("guidance_scale", 7.5)
        seed = data.get("seed")
        
        if seed is not None:
            generator = torch.Generator("cuda").manual_seed(seed)
        else:
            generator = torch.Generator("cuda")
            
        # Generate the image
        image = pipe(
            prompt=prompt,
            negative_prompt=negative_prompt,
            width=width,
            height=height,
            num_inference_steps=num_inference_steps,
            guidance_scale=guidance_scale,
            generator=generator
        ).images[0]
        
        # Convert to base64
        buffered = BytesIO()
        image.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        # Return JSON-RPC 2.0 formatted response
        return JSONResponse({
            "jsonrpc": "2.0",
            "id": data.get("id"),
            "result": {
                "image": img_str
            }
        })
        
    except Exception as e:
        # Return JSON-RPC 2.0 formatted error
        return JSONResponse({
            "jsonrpc": "2.0",
            "id": data.get("id") if isinstance(data, dict) else None,
            "error": {
                "code": -32000,
                "message": str(e)
            }
        }, status_code=500)

def signal_handler(sig, frame):
    logger.info("Shutting down server...")
    sys.exit(0)

if __name__ == "__main__":
    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    import uvicorn
    logger.info("Starting server on http://0.0.0.0:7862")
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=7862,
        log_level="info",
        access_log=True
    ) 