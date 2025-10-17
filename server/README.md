# Tax Assistant Backend

## Setup

### 1. Install Modal & Authenticate
```bash
pip install modal
modal token new
```

### 2. Verify Modal Apps Exist
```bash
modal app list
```

You need:
- RAG app: `tax-rag`
- LLM app: `ameena-tajik-ai-v0`

### 3. Get LLM Service URL
1. Go to https://modal.com/apps
2. Click on your LLM app
3. Find `serve` function
4. Copy the web URL

### 4. Install Dependencies
```bash
cd server
pip install -r requirements.txt
```

### 5. Configure Environment
```bash
cp .env.example .env
nano .env
```

Add your `LLM_SERVICE_URL`.

### 6. Run Verification Scripts

**Verify Modal Connection:**
```bash
python verify_modal.py
```
Must pass ✅

**Verify LLM Endpoint Format:**
```bash
python verify_llm_endpoint.py
```
Must pass ✅

### 7. Start Backend
```bash
python main.py
```

Wait for: "✅ Modal TaxRAG connected successfully"

### 8. Test Backend (separate terminal)
```bash
python test_backend.py
```

Both tests should pass ✅

## Troubleshooting

**"Tax RAG service not available"**
```bash
modal token new
modal app list
```

**"LLM service error"**
- Verify URL in .env
- Test: `curl https://your-url.modal.run`

**First request timeout**
- Normal! Cold start takes 10-30s
- Subsequent requests will be fast
