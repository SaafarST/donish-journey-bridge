# 🚀 PRE-LAUNCH CHECKLIST

## ⚠️ CRITICAL: Do These First

### 1. Verify Modal App Names
```bash
modal app list
```
- [ ] RAG app exists
- [ ] LLM app exists
- [ ] Note actual names if different

### 2. Get LLM Service URL
- [ ] Go to https://modal.com/apps
- [ ] Find LLM app → Copy web URL
- [ ] URL ends with `.modal.run`

### 3. Verify Frontend Dependencies
Check `/src/components/ui/` for:
- [ ] button.tsx
- [ ] card.tsx
- [ ] alert.tsx
- [ ] badge.tsx
- [ ] input.tsx

---

## Backend Setup

- [ ] Python 3.11+: `python --version`
- [ ] Modal CLI: `pip install modal`
- [ ] Authenticated: `modal token new`
- [ ] Dependencies: `cd server && pip install -r requirements.txt`
- [ ] Created `server/.env` from example
- [ ] Added `LLM_SERVICE_URL` to `.env`
- [ ] **Verified Modal**: `python server/verify_modal.py` ✅
- [ ] **Verified LLM Format**: `python server/verify_llm_endpoint.py` ✅

---

## Frontend Setup

- [ ] Node.js 18+: `node --version`
- [ ] Dependencies: `npm install`
- [ ] Created `.env` from example
- [ ] `VITE_API_URL=http://localhost:8000`

---

## Launch

### Terminal 1 - Backend
```bash
cd server
python main.py
```
Wait for: "✅ Modal TaxRAG connected"

### Terminal 2 - Test Backend
```bash
cd server
python test_backend.py
```
Verify: Both tests pass ✅

### Terminal 3 - Frontend
```bash
npm run dev
```

### Browser
http://localhost:5173

---

## First Test

Type: **"What is VAT?"**

Expected:
- ⏱️ First: 10-30s (cold start - NORMAL)
- ✅ AI answer in Tajik
- ✅ 3 source articles
- ✅ Processing time badge

---

## Troubleshooting

### Backend won't start
```bash
modal token new
modal app list
```

### First request timeout
**NORMAL!** Cold start takes 10-30s.
- Wait 10 seconds
- Try again
- Next requests will be fast

### Frontend can't connect
- Backend running on port 8000?
- `.env` has correct URL?
- `curl http://localhost:8000/health`

---

## Success Criteria

✅ Health check passes
✅ First search completes
✅ Answer in Tajik
✅ Sources displayed
✅ Second search fast (<5s)

**All ✅ → READY! 🎉**
