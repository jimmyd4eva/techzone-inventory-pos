"""
Database Abstraction Layer
Supports both MongoDB (web/cloud) and SQLite (desktop/offline)
"""
import os
import re
import json
import uuid
import aiosqlite
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Any, Optional
from motor.motor_asyncio import AsyncIOMotorClient

# Database type from environment
DB_TYPE = os.environ.get('DB_TYPE', 'mongodb')  # 'mongodb' or 'sqlite'
SQLITE_PATH = os.environ.get('SQLITE_PATH', str(Path(__file__).parent / 'data' / 'salestax.db'))


# ---------------------------------------------------------------------------
# Query helpers (extracted from SQLiteDatabase.find_many to flatten complexity)
# ---------------------------------------------------------------------------

def _op_matches(doc_value: Any, op: str, op_val: Any) -> bool:
    """Mongo-style operator on a single doc field. Returns True if it matches."""
    if op == "$gte":
        return (doc_value if doc_value is not None else 0) >= op_val
    if op == "$lte":
        return (doc_value if doc_value is not None else 0) <= op_val
    if op == "$in":
        return doc_value in op_val
    if op == "$ne":
        return doc_value != op_val
    if op == "$regex":
        return re.search(op_val, str(doc_value or ""), re.IGNORECASE) is not None
    # Unknown operator → don't filter the doc out.
    return True


def _field_matches(doc_value: Any, predicate: Any) -> bool:
    """Either equality or a {$op: val, ...} predicate dict."""
    if isinstance(predicate, dict):
        return all(_op_matches(doc_value, op, v) for op, v in predicate.items())
    return doc_value == predicate


def _doc_matches_query(doc: dict, query: Optional[dict]) -> bool:
    """Apply every top-level field predicate. Empty/None query matches everything."""
    if not query:
        return True
    return all(_field_matches(doc.get(field), pred) for field, pred in query.items())


class DatabaseInterface:
    """Abstract interface for database operations"""
    
    async def find_one(self, collection: str, query: dict, projection: dict = None) -> Optional[dict]:
        raise NotImplementedError
    
    async def find_many(self, collection: str, query: dict = None, projection: dict = None, sort: list = None) -> List[dict]:
        raise NotImplementedError
    
    async def insert_one(self, collection: str, document: dict) -> dict:
        raise NotImplementedError
    
    async def update_one(self, collection: str, query: dict, update: dict, upsert: bool = False) -> bool:
        raise NotImplementedError
    
    async def delete_one(self, collection: str, query: dict) -> bool:
        raise NotImplementedError
    
    async def count(self, collection: str, query: dict = None) -> int:
        raise NotImplementedError


class MongoDBDatabase(DatabaseInterface):
    """MongoDB implementation"""
    
    def __init__(self, mongo_url: str, db_name: str):
        self.client = AsyncIOMotorClient(mongo_url)
        self.db = self.client[db_name]
    
    async def find_one(self, collection: str, query: dict, projection: dict = None) -> Optional[dict]:
        if projection is None:
            projection = {"_id": 0}
        return await self.db[collection].find_one(query, projection)
    
    async def find_many(self, collection: str, query: dict = None, projection: dict = None, sort: list = None) -> List[dict]:
        if query is None:
            query = {}
        if projection is None:
            projection = {"_id": 0}
        cursor = self.db[collection].find(query, projection)
        if sort:
            cursor = cursor.sort(sort)
        return await cursor.to_list(length=None)
    
    async def insert_one(self, collection: str, document: dict) -> dict:
        result = await self.db[collection].insert_one(document)
        return document
    
    async def update_one(self, collection: str, query: dict, update: dict, upsert: bool = False) -> bool:
        if "$set" in update:
            result = await self.db[collection].update_one(query, update, upsert=upsert)
        else:
            result = await self.db[collection].update_one(query, {"$set": update}, upsert=upsert)
        return result.modified_count > 0 or result.upserted_id is not None
    
    async def delete_one(self, collection: str, query: dict) -> bool:
        result = await self.db[collection].delete_one(query)
        return result.deleted_count > 0
    
    async def count(self, collection: str, query: dict = None) -> int:
        if query is None:
            query = {}
        return await self.db[collection].count_documents(query)


class SQLiteDatabase(DatabaseInterface):
    """SQLite implementation for offline desktop use"""
    
    def __init__(self, db_path: str):
        self.db_path = db_path
        # Ensure directory exists
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)
    
    async def _get_connection(self):
        return await aiosqlite.connect(self.db_path)
    
    async def initialize(self):
        """Create tables if they don't exist"""
        async with await self._get_connection() as conn:
            # Create a generic key-value store for each collection
            await conn.execute('''
                CREATE TABLE IF NOT EXISTS collections (
                    id TEXT PRIMARY KEY,
                    collection TEXT NOT NULL,
                    data TEXT NOT NULL,
                    created_at TEXT
                )
            ''')
            await conn.execute('CREATE INDEX IF NOT EXISTS idx_collection ON collections(collection)')
            await conn.commit()
    
    def _serialize(self, doc: dict) -> str:
        return json.dumps(doc, default=str)
    
    def _deserialize(self, data: str) -> dict:
        return json.loads(data)
    
    async def find_one(self, collection: str, query: dict, projection: dict = None) -> Optional[dict]:
        async with await self._get_connection() as conn:
            # Simple query by id or first match
            if "id" in query:
                cursor = await conn.execute(
                    'SELECT data FROM collections WHERE collection = ? AND id = ?',
                    (collection, query["id"])
                )
            else:
                cursor = await conn.execute(
                    'SELECT data FROM collections WHERE collection = ?',
                    (collection,)
                )
            row = await cursor.fetchone()
            if row:
                doc = self._deserialize(row[0])
                # Apply projection (basic implementation)
                if projection:
                    for key in list(doc.keys()):
                        if key not in projection and projection.get(key) != 1:
                            if projection.get("_id") == 0 and key == "_id":
                                del doc[key]
                return doc
            return None
    
    async def find_many(self, collection: str, query: dict = None, projection: dict = None, sort: list = None) -> List[dict]:
        async with await self._get_connection() as conn:
            cursor = await conn.execute(
                'SELECT data FROM collections WHERE collection = ?',
                (collection,)
            )
            rows = await cursor.fetchall()
            results = [
                doc for doc in (self._deserialize(row[0]) for row in rows)
                if _doc_matches_query(doc, query)
            ]

            # Apply sorting
            if sort:
                for sort_key, sort_dir in reversed(sort):
                    # Bind sort_key via default arg to avoid late-binding closure
                    # when the loop iterates over multiple sort keys.
                    results.sort(
                        key=lambda x, k=sort_key: x.get(k, ""),
                        reverse=(sort_dir == -1),
                    )

            return results
    
    async def insert_one(self, collection: str, document: dict) -> dict:
        doc_id = document.get("id", str(uuid.uuid4()))
        document["id"] = doc_id
        
        async with await self._get_connection() as conn:
            await conn.execute(
                'INSERT OR REPLACE INTO collections (id, collection, data, created_at) VALUES (?, ?, ?, ?)',
                (doc_id, collection, self._serialize(document), datetime.now(timezone.utc).isoformat())
            )
            await conn.commit()
        return document
    
    async def update_one(self, collection: str, query: dict, update: dict, upsert: bool = False) -> bool:
        # Get existing document
        existing = await self.find_one(collection, query)
        
        if existing:
            # Apply update
            if "$set" in update:
                existing.update(update["$set"])
            else:
                existing.update(update)
            
            async with await self._get_connection() as conn:
                await conn.execute(
                    'UPDATE collections SET data = ? WHERE collection = ? AND id = ?',
                    (self._serialize(existing), collection, existing["id"])
                )
                await conn.commit()
            return True
        elif upsert:
            # Create new document
            new_doc = query.copy()
            if "$set" in update:
                new_doc.update(update["$set"])
            else:
                new_doc.update(update)
            await self.insert_one(collection, new_doc)
            return True
        return False
    
    async def delete_one(self, collection: str, query: dict) -> bool:
        async with await self._get_connection() as conn:
            if "id" in query:
                cursor = await conn.execute(
                    'DELETE FROM collections WHERE collection = ? AND id = ?',
                    (collection, query["id"])
                )
            else:
                cursor = await conn.execute(
                    'DELETE FROM collections WHERE collection = ? LIMIT 1',
                    (collection,)
                )
            await conn.commit()
            return cursor.rowcount > 0
    
    async def count(self, collection: str, query: dict = None) -> int:
        docs = await self.find_many(collection, query)
        return len(docs)


# Factory function to get the right database
def get_database() -> DatabaseInterface:
    if DB_TYPE == 'sqlite':
        return SQLiteDatabase(SQLITE_PATH)
    else:
        mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
        db_name = os.environ.get('DB_NAME', 'salestax')
        return MongoDBDatabase(mongo_url, db_name)


# Global database instance
database = get_database()
