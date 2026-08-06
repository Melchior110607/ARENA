"""Arena prototype API.

A deliberately small FastAPI service over fictional data held in memory. Its job is
to prove that the frontend talks to a real backend, and to pin down the data shapes
a future production system would need — nothing more.
"""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import companies, connections, messages, meta, notices, products

DESCRIPTION = """
B2B network prototype connecting brands, suppliers, manufacturers, processors and raw
material producers across textile and construction.

Companies publish what they can actually make, post notices on the floor — a need or an
offer, addressed to specific company types — and connect from anywhere: a profile, a
product, or a notice. Accepting a connection opens the conversation.

**All data is fictional.** No database, no authentication, no persistence: mutations
live in the process and are lost on restart.
"""

app = FastAPI(
    title="Arena API",
    description=DESCRIPTION,
    version="0.1.0",
)

# The browser calls this API directly from the Next.js frontend, so its origin has to
# be allowed. Server-side rendering reaches the container over the compose network and
# never goes through CORS.
allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3100,http://127.0.0.1:3100",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in allowed_origins if origin.strip()],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

for router in (
    meta.router,
    notices.router,
    companies.router,
    products.router,
    connections.router,
    messages.router,
):
    app.include_router(router)
