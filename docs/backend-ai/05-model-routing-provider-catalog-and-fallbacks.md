# Model Routing Provider Catalog And Fallbacks

- This file documents the provider-aware gateway implemented in backend/services/gemini.js.
- The filename is historical; the implementation is now a multi-provider routing layer with task-aware ranking and fallback execution.
- Use this file whenever you need to add a provider, change model ranking, or understand why the selected model differs from the requested model.

### `backend/services/gemini.js`

- Responsibility: Gateway for model discovery, prompt assembly, provider execution, and structured fallback handling.
- Defines baked-in model defaults for OpenRouter, Gemini direct, Together AI, and Groq direct.
- Supports direct single-model fallbacks for Hugging Face router and xAI Grok direct when those keys exist.
- Maintains an in-memory runtimeModelCatalog cache with a TTL controlled by MODEL_CATALOG_TTL_MS.
- Refreshes provider catalogs lazily on demand and eagerly at startup when provider keys exist.
- Adds provider labels and supportsFiles metadata to catalog entries before returning them to callers.
- Resolves an explicit requested model if available, otherwise falls back to MODEL_NAME or the first visible model.
- Supports client-facing auto routing by ranking available models according to operation type, prompt complexity, and attachment presence.
- Retries across multiple ranked models when an error is classified as retryable.
- Normalizes retryable provider failures into structured errors with status code, retry hint, and provider metadata.

## Supported Provider Families

- OpenRouter models are fetched from https://openrouter.ai/api/v1/models when OPENROUTER_API_KEY exists.
- Gemini direct models are fetched from https://generativelanguage.googleapis.com/v1beta/models when GEMINI_API_KEY exists.
- Together AI models are fetched from https://api.together.xyz/v1/models when TOGETHER_API_KEY exists.
- Groq direct models are fetched from https://api.groq.com/openai/v1/models when GROQ_API_KEY exists.
- xAI Grok direct models are fetched from https://api.x.ai/v1/models when GROK_API_KEY or XAI_API_KEY exists.
- Hugging Face router uses a configured model id from HUGGINGFACE_MODEL or a baked-in default when HUGGINGFACE_API_KEY exists.

## Environment Variables That Matter

- DEFAULT_AI_MODEL can set the default model across providers.
- OPENROUTER_DEFAULT_MODEL influences the default when DEFAULT_AI_MODEL is absent.
- OPENROUTER_API_KEY enables OpenRouter catalog loading and requests.
- OPENROUTER_MODELS can override the visible OpenRouter model list with a comma-separated configuration string.
- GEMINI_API_KEY enables Gemini direct catalog loading and requests.
- GEMINI_MODEL and GEMINI_MODELS influence Gemini direct defaults and visible models.
- GROK_API_KEY or XAI_API_KEY enables xAI direct requests.
- GROQ_API_KEY enables Groq direct catalog loading and requests.
- TOGETHER_API_KEY enables Together AI catalog loading and requests.
- HUGGINGFACE_API_KEY enables Hugging Face router requests.
- HUGGINGFACE_MODEL overrides the default Hugging Face model id.
- MODEL_CATALOG_TTL_MS controls how long remote catalog results are cached.
- AI_FALLBACK_MODEL_LIMIT controls how many ranked models can be tried on a request.
- AI_JSON_MAX_COMPLETION_TOKENS, AI_CHAT_MAX_COMPLETION_TOKENS, and AI_MAX_COMPLETION_TOKENS influence max output size.

## Model Discovery And Visibility Rules

- Only providers with configured keys contribute visible models.
- OpenRouter catalog entries are filtered to text-capable output modalities.
- Together AI catalog entries are filtered to chat-capable models and exclude obvious speech, image, and video endpoints.
- Groq catalog entries exclude whisper, guard, and unsupported safety-only models.
- Gemini direct catalog entries exclude embeddings, image generation, audio, deep-research, robotics, and live-oriented models.
- When no providers are configured and fallback inclusion is allowed, the backend exposes a synthetic fallback/offline model.
- The UI-facing GET /api/ai/models route hides the synthetic fallback and adds a synthetic auto model instead.

## Auto Routing Rules

- Prompt complexity is high when there is an attachment, when the operation is group-chat, or when prompt length exceeds 2800 characters.
- Prompt complexity is medium when the operation is json or prompt length exceeds 1200 characters.
- Prompt complexity is low otherwise.
- For JSON work, the ranking prefers fast structured models first at low and medium complexity, and stronger reasoning models at high complexity.
- For chat work, the ranking prefers chat-capable fast models first at low complexity and larger reasoning models at high complexity.
- Attachment presence biases the ranking toward Gemini and GPT-class models that are more likely to support file or image interpretation.
- If the request explicitly names a model and the id is not auto, the backend disables auto routing and resolves that model directly.
- If the request uses auto or omits modelId, the backend records autoMode true and the estimated complexity in routing metadata.

## Fallback Execution Rules

- The gateway builds an attempt chain from the selected model plus the remaining ranked models.
- The gateway logs AI_ATTEMPT before each provider call with operation, attempt number, model id, provider, prompt length, attachment presence, and complexity.
- If a call succeeds, the gateway logs AI_SUCCESS and returns content, usage, processing time, and routing metadata.
- If a call fails, the gateway normalizes the error and determines whether retry is safe.
- Retryable failures include quota-style provider responses, model-unavailable conditions, provider credit issues, network errors, and 5xx responses.
- Non-retryable failures are rethrown immediately.
- When all attempts fail, the last normalized error bubbles back to the route or socket layer.
- When no provider-backed models exist at all, the gateway returns an offline fallback response rather than throwing.

## Attachment Handling In The Gateway

- The gateway resolves the uploaded file path from attachment.fileUrl and uploadDir.
- Plain text, markdown, CSV, JSON, and XML attachments can be read directly into promptText.
- Images under 3 MB can be converted into base64 data URLs and attached to OpenAI-like or Gemini payloads.
- PDFs currently add only metadata text because extraction is not enabled.
- Project files reuse the same attachment payload builder so project context and direct chat attachments stay consistent.

- Gateway note 001: the requested model is a preference, but the persisted selected model is the source of truth for what actually ran.
- Gateway note 002: remote catalog refresh affects only model visibility, not the core request payload contract sent by the frontend.
- Gateway note 003: supportsFiles is a capability hint for the UI and prompt builder, not a complete guarantee of identical provider behavior.
- Gateway note 004: task-aware ranking is heuristic and should be treated as a policy layer that can evolve without changing the external API.
- Gateway note 005: if you add a provider, update discovery, visibility filters, request execution, usage extraction, and labels together.
- Gateway note 006: offline fallback exists so the application can return something intelligible even with zero configured providers.
- Gateway note 007: route and socket handlers rely on normalized gateway errors to decide whether to send 429, 503, or a generic failure.

