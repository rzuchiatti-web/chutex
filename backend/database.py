from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'chutex_db')]

JWT_SECRET = os.environ.get('JWT_SECRET', 'chutex-jwt-secret')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRY_HOURS = 72
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

TWILIO_SID = os.environ.get('TWILIO_ACCOUNT_SID', '')
TWILIO_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN', '')
TWILIO_NUMBER = os.environ.get('TWILIO_PHONE_NUMBER', '')

from twilio.rest import Client as TwilioClient
twilio_client = TwilioClient(TWILIO_SID, TWILIO_TOKEN) if TWILIO_SID and TWILIO_TOKEN else None
