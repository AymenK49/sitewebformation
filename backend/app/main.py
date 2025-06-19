from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from starlette.middleware.sessions import SessionMiddleware
from starlette_rate_limit import RateLimitMiddleware, BaseBackend
from datetime import datetime, timedelta
from typing import Optional
import jwt
from pydantic import BaseModel

app = FastAPI(
    title="Plateforme de Formation Cybersécurité",
    description="API sécurisée pour la plateforme de formation en cybersécurité",
    version="1.0.0"
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration Rate Limiting
app.add_middleware(RateLimitMiddleware)

# Configuration Session
app.add_middleware(
    SessionMiddleware,
    secret_key="your-secret-key",  # À remplacer par une clé secrète sécurisée
    max_age=3600  # 1 heure
)

# Modèles Pydantic
class Token(BaseModel):
    access_token: str
    token_type: str

class UserBase(BaseModel):
    email: str
    role: str = "employee"

class UserCreate(UserBase):
    password: str

# Configuration JWT
SECRET_KEY = "your-secret-key"  # À remplacer par une clé secrète sécurisée
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Fonctions d'authentification
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    # Ici, ajoutez la logique pour récupérer l'utilisateur depuis la base de données
    return email

# Routes
@app.get("/")
async def root():
    return {"message": "Bienvenue sur l'API de la plateforme de formation en cybersécurité"}

@app.post("/token")
async def login_for_access_token(user: UserCreate):
    # Ici, ajoutez la logique de vérification des identifiants
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me")
async def read_users_me(current_user: str = Depends(get_current_user)):
    return {"email": current_user}

# Middleware pour le logging des requêtes
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = datetime.utcnow()
    response = await call_next(request)
    end_time = datetime.utcnow()
    
    # Log de la requête
    print(f"[{start_time}] {request.method} {request.url} - Status: {response.status_code} - Duration: {end_time - start_time}")
    
    return response

# Gestion des erreurs globale
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return {"detail": exc.detail}, exc.status_code