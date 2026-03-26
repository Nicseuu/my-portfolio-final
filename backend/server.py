from fastapi import FastAPI, APIRouter, HTTPException, Request, UploadFile, File as FastAPIFile, Form
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME', 'admin')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin123')

UPLOAD_DIR = ROOT_DIR / 'uploads'
UPLOAD_DIR.mkdir(exist_ok=True)

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ===================== Models =====================

class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class ContactMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    project: Optional[str] = None
    message: str
    preferred_date: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "new"

class ContactMessageCreate(BaseModel):
    name: str
    email: str
    project: Optional[str] = None
    message: str
    preferred_date: Optional[str] = None

class PageView(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    page: str
    visitor_id: str
    user_agent: Optional[str] = None
    referrer: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PageViewCreate(BaseModel):
    page: str
    visitor_id: str
    user_agent: Optional[str] = None
    referrer: Optional[str] = None

class AnalyticsEvent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_type: str
    visitor_id: str
    metadata: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AnalyticsEventCreate(BaseModel):
    event_type: str
    visitor_id: str
    metadata: Optional[Dict[str, Any]] = None

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    conversation_id: str
    sender: str
    message: str
    visitor_name: Optional[str] = None
    visitor_email: Optional[str] = None
    is_read: bool = False
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatMessageCreate(BaseModel):
    conversation_id: str
    sender: str
    message: str
    visitor_name: Optional[str] = None
    visitor_email: Optional[str] = None

class Conversation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    visitor_id: str
    visitor_name: Optional[str] = None
    visitor_email: Optional[str] = None
    status: str = "active"
    unread_count: int = 0
    last_message: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ===================== Helpers =====================

async def send_email_notification(contact: ContactMessage):
    try:
        smtp_host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
        smtp_port = int(os.environ.get('SMTP_PORT', '587'))
        smtp_user = os.environ.get('SMTP_USER', '')
        smtp_password = os.environ.get('SMTP_PASSWORD', '')
        recipient_email = os.environ.get('RECIPIENT_EMAIL', 'jcabidoy147@gmail.com')
        if not smtp_user or not smtp_password:
            logger.warning("SMTP credentials not configured.")
            return False
        msg = MIMEMultipart()
        msg['From'] = smtp_user
        msg['To'] = recipient_email
        msg['Subject'] = f"New Contact from {contact.name}"
        body = f"FROM: {contact.name}\nEMAIL: {contact.email}\nPROJECT: {contact.project or 'N/A'}\nDATE: {contact.preferred_date or 'N/A'}\n\nMESSAGE:\n{contact.message}"
        msg.attach(MIMEText(body, 'plain'))
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
        return True
    except Exception as e:
        logger.error(f"Email failed: {e}")
        return False

ALLOWED_FILE_SLOTS = {
    "resume": {"max_size": 10*1024*1024, "allowed_extensions": [".pdf"]},
    "landing_page": {"max_size": 10*1024*1024, "allowed_extensions": [".pdf", ".png", ".jpg", ".jpeg"]},
}
CONTENT_TYPE_MAP = {".pdf": "application/pdf", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg"}

# ===================== Status =====================

@api_router.get("/")
async def root():
    return {"message": "Janica Cabidoy Portfolio API"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    obj = StatusCheck(**input.model_dump())
    doc = obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.status_checks.insert_one(doc)
    return obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for c in checks:
        if isinstance(c['timestamp'], str): c['timestamp'] = datetime.fromisoformat(c['timestamp'])
    return checks

# ===================== Contact =====================

@api_router.post("/contact", response_model=ContactMessage)
async def create_contact_message(input: ContactMessageCreate):
    obj = ContactMessage(**input.model_dump())
    doc = obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.contact_messages.insert_one(doc)
    await send_email_notification(obj)
    return obj

@api_router.get("/contact", response_model=List[ContactMessage])
async def get_contact_messages():
    msgs = await db.contact_messages.find({}, {"_id": 0}).to_list(1000)
    for m in msgs:
        if isinstance(m.get('created_at'), str): m['created_at'] = datetime.fromisoformat(m['created_at'])
    return sorted(msgs, key=lambda x: x['created_at'], reverse=True)

@api_router.patch("/contact/{message_id}/status")
async def update_contact_status(message_id: str, status: str):
    if status not in ["new", "read", "replied"]: raise HTTPException(400, "Invalid status")
    r = await db.contact_messages.update_one({"id": message_id}, {"$set": {"status": status}})
    if r.modified_count == 0: raise HTTPException(404, "Not found")
    return {"success": True}

@api_router.delete("/contact/{message_id}")
async def delete_contact_message(message_id: str):
    r = await db.contact_messages.delete_one({"id": message_id})
    if r.deleted_count == 0: raise HTTPException(404, "Not found")
    return {"success": True}

# ===================== Content =====================

@api_router.get("/content")
async def get_all_content():
    content = await db.content.find({}, {"_id": 0}).to_list(100)
    return {item['section']: item.get('data', {}) for item in content}

@api_router.get("/content/{section}")
async def get_section_content(section: str):
    c = await db.content.find_one({"section": section}, {"_id": 0})
    return c.get('data', {}) if c else {}

@api_router.put("/content/{section}")
async def update_section_content(section: str, data: Dict[str, Any]):
    await db.content.update_one({"section": section}, {"$set": {"section": section, "data": data, "updated_at": datetime.now(timezone.utc).isoformat()}}, upsert=True)
    return {"success": True}

@api_router.delete("/content/{section}")
async def delete_section_content(section: str):
    await db.content.delete_one({"section": section})
    return {"success": True}

# ===================== File Management =====================

@api_router.get("/files")
async def list_files():
    return await db.uploaded_files.find({}, {"_id": 0}).to_list(100)

@api_router.post("/files/upload")
async def upload_file(file: UploadFile = FastAPIFile(...), file_slot: str = Form(...)):
    if file_slot not in ALLOWED_FILE_SLOTS:
        raise HTTPException(400, f"Invalid slot. Must be: {list(ALLOWED_FILE_SLOTS.keys())}")
    cfg = ALLOWED_FILE_SLOTS[file_slot]
    ext = Path(file.filename).suffix.lower()
    if ext not in cfg["allowed_extensions"]:
        raise HTTPException(400, f"Invalid type '{ext}'. Allowed: {cfg['allowed_extensions']}")
    content = await file.read()
    if len(content) > cfg["max_size"]:
        raise HTTPException(400, f"File too large. Max: {cfg['max_size']/(1024*1024)}MB")

    file_id = str(uuid.uuid4())
    stored = f"{file_id}{ext}"
    # Delete old
    old = await db.uploaded_files.find_one({"file_slot": file_slot})
    if old:
        p = UPLOAD_DIR / old.get("stored_filename", "")
        if p.exists(): p.unlink()
        await db.uploaded_files.delete_one({"file_slot": file_slot})
    # Save new
    with open(UPLOAD_DIR / stored, "wb") as f:
        f.write(content)
    doc = {"id": file_id, "file_slot": file_slot, "original_filename": file.filename, "stored_filename": stored,
           "file_size": len(content), "content_type": file.content_type or CONTENT_TYPE_MAP.get(ext, "application/octet-stream"),
           "uploaded_at": datetime.now(timezone.utc).isoformat()}
    await db.uploaded_files.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/files/download/{file_slot}")
async def download_file(file_slot: str):
    doc = await db.uploaded_files.find_one({"file_slot": file_slot})
    if not doc: raise HTTPException(404, "No file found")
    fp = UPLOAD_DIR / doc["stored_filename"]
    if not fp.exists(): raise HTTPException(404, "File missing from disk")
    def iter_file():
        with open(fp, "rb") as f:
            while chunk := f.read(8192): yield chunk
    return StreamingResponse(iter_file(), media_type=doc.get("content_type", "application/octet-stream"),
        headers={"Content-Disposition": f'attachment; filename="{doc["original_filename"]}"', "Content-Length": str(doc.get("file_size", 0))})

@api_router.delete("/files/{file_slot}")
async def delete_file(file_slot: str):
    doc = await db.uploaded_files.find_one({"file_slot": file_slot})
    if not doc: raise HTTPException(404, "No file found")
    fp = UPLOAD_DIR / doc["stored_filename"]
    if fp.exists(): fp.unlink()
    await db.uploaded_files.delete_one({"file_slot": file_slot})
    return {"success": True}

# ===================== Analytics =====================

@api_router.post("/analytics/pageview")
async def track_pageview(input: PageViewCreate):
    doc = PageView(**input.model_dump()).model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.pageviews.insert_one(doc)
    return {"success": True}

@api_router.post("/analytics/event")
async def track_event(input: AnalyticsEventCreate):
    doc = AnalyticsEvent(**input.model_dump()).model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.analytics_events.insert_one(doc)
    return {"success": True}

@api_router.get("/analytics/messages")
async def get_message_analytics():
    return {"total": await db.contact_messages.count_documents({}), "new": await db.contact_messages.count_documents({"status": "new"}),
            "read": await db.contact_messages.count_documents({"status": "read"}), "replied": await db.contact_messages.count_documents({"status": "replied"})}

@api_router.get("/analytics/overview")
async def get_analytics_overview():
    uv = await db.pageviews.distinct("visitor_id")
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    return {
        "pageviews": {"total": await db.pageviews.count_documents({}), "unique_visitors": len(uv),
                       "last_7_days": await db.pageviews.count_documents({"timestamp": {"$gte": week_ago}})},
        "events": {"resume_downloads": await db.analytics_events.count_documents({"event_type": "resume_download"}),
                   "contact_submissions": await db.contact_messages.count_documents({})},
        "chat": {"total_conversations": await db.conversations.count_documents({}),
                 "active_conversations": await db.conversations.count_documents({"status": "active"})}
    }

@api_router.get("/analytics/visitors")
async def get_visitor_analytics():
    stats = []
    for i in range(30):
        d = datetime.now(timezone.utc) - timedelta(days=i)
        s = d.replace(hour=0, minute=0, second=0, microsecond=0)
        e = s + timedelta(days=1)
        stats.append({"date": s.strftime("%Y-%m-%d"), "views": await db.pageviews.count_documents({"timestamp": {"$gte": s.isoformat(), "$lt": e.isoformat()}})})
    return {"daily_stats": list(reversed(stats))}

# ===================== Live Chat =====================

@api_router.post("/chat/conversation")
async def create_or_get_conversation(visitor_id: str, visitor_name: Optional[str] = None, visitor_email: Optional[str] = None):
    ex = await db.conversations.find_one({"visitor_id": visitor_id, "status": "active"}, {"_id": 0})
    if ex:
        upd = {}
        if visitor_name: upd["visitor_name"] = visitor_name
        if visitor_email: upd["visitor_email"] = visitor_email
        if upd: await db.conversations.update_one({"id": ex["id"]}, {"$set": upd}); ex.update(upd)
        return ex
    c = Conversation(visitor_id=visitor_id, visitor_name=visitor_name, visitor_email=visitor_email)
    doc = c.model_dump(); doc['created_at'] = doc['created_at'].isoformat(); doc['updated_at'] = doc['updated_at'].isoformat()
    await db.conversations.insert_one(doc)
    return c.model_dump()

@api_router.get("/chat/conversations")
async def get_all_conversations():
    convs = await db.conversations.find({}, {"_id": 0}).to_list(100)
    return sorted(convs, key=lambda x: x.get('updated_at', ''), reverse=True)

@api_router.get("/chat/conversation/{cid}")
async def get_conversation(cid: str):
    c = await db.conversations.find_one({"id": cid}, {"_id": 0})
    if not c: raise HTTPException(404, "Not found")
    msgs = await db.chat_messages.find({"conversation_id": cid}, {"_id": 0}).to_list(1000)
    return {"conversation": c, "messages": sorted(msgs, key=lambda x: x.get('timestamp', ''))}

@api_router.post("/chat/message")
async def send_chat_message(input: ChatMessageCreate):
    m = ChatMessage(**input.model_dump()); doc = m.model_dump(); doc['timestamp'] = doc['timestamp'].isoformat()
    await db.chat_messages.insert_one(doc)
    upd = {"updated_at": datetime.now(timezone.utc).isoformat(), "last_message": input.message[:100]}
    if input.visitor_name: upd["visitor_name"] = input.visitor_name
    if input.visitor_email: upd["visitor_email"] = input.visitor_email
    if input.sender == "visitor":
        await db.conversations.update_one({"id": input.conversation_id}, {"$set": upd, "$inc": {"unread_count": 1}})
    else:
        await db.conversations.update_one({"id": input.conversation_id}, {"$set": upd})
    return m.model_dump()

@api_router.get("/chat/messages/{cid}")
async def get_chat_messages(cid: str):
    msgs = await db.chat_messages.find({"conversation_id": cid}, {"_id": 0}).to_list(1000)
    return sorted(msgs, key=lambda x: x.get('timestamp', ''))

@api_router.patch("/chat/conversation/{cid}/read")
async def mark_conversation_read(cid: str):
    await db.chat_messages.update_many({"conversation_id": cid, "sender": "visitor"}, {"$set": {"is_read": True}})
    await db.conversations.update_one({"id": cid}, {"$set": {"unread_count": 0}})
    return {"success": True}

@api_router.patch("/chat/conversation/{cid}/close")
async def close_conversation(cid: str):
    await db.conversations.update_one({"id": cid}, {"$set": {"status": "closed", "updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"success": True}

@api_router.get("/chat/unread-count")
async def get_unread_count():
    r = await db.conversations.aggregate([{"$match": {"status": "active"}}, {"$group": {"_id": None, "total": {"$sum": "$unread_count"}}}]).to_list(1)
    return {"unread_count": r[0]["total"] if r else 0}

# ===================== App Setup =====================

app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
