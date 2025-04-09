from fastapi import FastAPI, HTTPException, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, Literal, List
import requests
import base64
from io import BytesIO
from PIL import Image
import json
import asyncio
from sse_starlette.sse import EventSourceResponse

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class JsonRpcRequest(BaseModel):
    jsonrpc: Literal["2.0"]
    method: str
    params: Optional[Dict[str, Any]] = None
    id: Optional[str] = None

class Tool(BaseModel):
    name: str
    description: str

class ServerStatus(BaseModel):
    name: str = "stable-diffusion"
    status: Literal["healthy", "unhealthy"]
    description: str
    tools: List[Tool] = []

async def status_event_generator(request: Request):
    while True:
        try:
            # Check if SD Web UI is accessible
            response = requests.get("http://localhost:7860/sdapi/v1/sd-models")
            if response.status_code == 200:
                status = "healthy"
                description = "Stable Diffusion for image generation"
            else:
                status = "unhealthy"
                description = "Stable Diffusion Web UI not responding"
        except:
            status = "unhealthy"
            description = "Cannot connect to Stable Diffusion Web UI"
        
        server_status = ServerStatus(
            status=status,
            description=description
        )
        
        yield {
            "event": "message",
            "data": json.dumps({
                "jsonrpc": "2.0",
                "method": "status",
                "params": server_status.model_dump()
            })
        }
        await asyncio.sleep(1)

@app.get("/")
async def root(request: Request):
    return EventSourceResponse(status_event_generator(request))

class ImageRequest(BaseModel):
    prompt: str
    negative_prompt: str = ""
    steps: int = 20
    width: int = 512
    height: int = 512

@app.post("/generate")
async def generate_image(request: JsonRpcRequest):
    try:
        img_request = ImageRequest(**request.params)
        payload = img_request.model_dump()
        
        response = requests.post("http://localhost:7860/sdapi/v1/txt2img", json=payload)
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to generate image")
        
        result = response.json()
        return {
            "jsonrpc": "2.0",
            "method": "generate",
            "params": {"image": result["images"][0]},
            "id": request.id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check(request: Request):
    try:
        response = requests.get("http://localhost:7860/sdapi/v1/sd-models")
        status = ServerStatus(
            status="healthy" if response.status_code == 200 else "unhealthy",
            description="Connected to Stable Diffusion Web UI" if response.status_code == 200 else "Stable Diffusion Web UI not responding"
        )
        return {
            "jsonrpc": "2.0",
            "method": "health",
            "params": status.model_dump(),
            "id": request.query_params.get("id", "health-1")
        }
    except:
        status = ServerStatus(
            status="unhealthy",
            description="Cannot connect to Stable Diffusion Web UI"
        )
        return {
            "jsonrpc": "2.0",
            "method": "health",
            "params": status.model_dump(),
            "id": request.query_params.get("id", "health-1")
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=7861, log_level="info") 