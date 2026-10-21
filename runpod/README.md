# RunPod inference workload

The application uses the official **RunPod vLLM Serverless worker**, rather than
the echo example in `handler.py`. GPU work is Qwen3-4B-Instruct-2507 text generation
from the actual synthetic profile plus retrieved sources, constrained by a JSON
schema. `handler.py` remains the historical template and is **not deployed**.

Official setup: https://docs.runpod.io/serverless/vllm/get-started
API: https://docs.runpod.io/serverless/vllm/openai-compatibility
Model/license: https://huggingface.co/Qwen/Qwen3-4B-Instruct-2507 (Apache-2.0).

Provision only after account owner approves current GPU price and spending cap:

1. Create a Serverless vLLM endpoint in the existing account. Select the official
   worker image; record its exact version/digest in evidence (do not silently use
   an unrecorded latest image). Model: `Qwen/Qwen3-4B-Instruct-2507`.
2. Initial candidate: 24 GB or larger GPU, max model length 32768, one maximum
   worker, zero active/minimum workers, idle timeout 5 seconds. Confirm memory
   and cold-start behaviour with a single request before enabling public use.
3. Ensure the worker supports `response_format: json_schema`; the backend uses
   `/openai/v1/chat/completions`, not the queue API echo handler. No paid request
   has been made by this repository's offline tests.
4. Put the endpoint ID, API key and exact served model name in backend secrets.
   No shared access code is required. Anonymous sessions, per-network/session rate
   limits and shared quotas protect paid calls; see `docs/ACCESS_CONTROL.md`.
   Never include these values in screenshots or commits.
5. Run `python scripts/live_check.py` against a candidate server. Review the
   generated output for actual relevance and source entailment. Record model
   revision, request ID, GPU, latency, worker logs, token counts and billing.

There is no fabricated fallback and no claim that configuration equals successful
inference. In-process limits reset on restart and are not a billing guarantee;
keep Replit at one instance and set spending controls in the RunPod account.
Do not replace the live static prototype until this integration passes.

## Provisioned endpoint (21 October 2026)

Endpoint `cckbk8134lpxf8`, official vLLM worker `v2.29.0`; selected model
`Qwen/Qwen3-4B-Instruct-2507`, revision
`cdbee75f17c01a7cc42f958dc650907174af0554`.
One 24GB GPU per worker, maximum one worker, zero active workers, idle timeout
5 seconds, execution timeout 300 seconds. `MAX_MODEL_LEN=32768`,
`MAX_NUM_SEQS=1`, `MAX_CONCURRENCY=1`, `GPU_MEMORY_UTILIZATION=0.90`.
Actual inference verification is tracked in `docs/EVIDENCE.md`.
