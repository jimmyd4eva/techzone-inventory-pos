"""Symmetric encryption helpers for passphrase-protected backups.

We use AES-256-GCM (authenticated encryption) with a key derived from the
user-provided passphrase via PBKDF2-HMAC-SHA256. The output format is a
self-describing wrapper so a future restore tool can detect encryption
without the user needing to remember anything about the file:

    bytes  0..7    magic "TZBKv1\\0\\0"
    bytes  8..23   salt (16 bytes random)
    bytes 24..35   nonce (12 bytes random)
    bytes 36..n    AES-256-GCM ciphertext + 16-byte auth tag

Plaintext is the raw bytes of a backup zip. Wrong passphrase or any tampering
raises `cryptography.exceptions.InvalidTag`, which we surface as a clean 400
with a clear error message.
"""
import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

MAGIC = b"TZBKv1\x00\x00"           # 8 bytes — distinguishes us from raw zips
SALT_LEN = 16
NONCE_LEN = 12
PBKDF2_ITERATIONS = 200_000          # 2025-era OWASP guidance
KEY_LEN = 32                         # AES-256


def _derive_key(passphrase: str, salt: bytes) -> bytes:
    """Stretch a user passphrase into a 256-bit AES key with PBKDF2."""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=KEY_LEN,
        salt=salt,
        iterations=PBKDF2_ITERATIONS,
    )
    return kdf.derive(passphrase.encode("utf-8"))


def encrypt(plaintext: bytes, passphrase: str) -> bytes:
    """Wrap plaintext into the self-describing encrypted envelope."""
    salt = os.urandom(SALT_LEN)
    nonce = os.urandom(NONCE_LEN)
    key = _derive_key(passphrase, salt)
    ciphertext = AESGCM(key).encrypt(nonce, plaintext, None)
    return MAGIC + salt + nonce + ciphertext


def is_encrypted(payload: bytes) -> bool:
    """Cheap header sniff — does this look like one of our encrypted backups?"""
    return len(payload) >= len(MAGIC) and payload[: len(MAGIC)] == MAGIC


def decrypt(payload: bytes, passphrase: str) -> bytes:
    """Reverse `encrypt`. Raises ValueError on bad passphrase / tampered file."""
    if not is_encrypted(payload):
        raise ValueError("Not an encrypted TechZone backup")
    header_end = len(MAGIC) + SALT_LEN + NONCE_LEN
    if len(payload) < header_end + 16:  # +16 for GCM tag
        raise ValueError("Encrypted backup is truncated")
    salt = payload[len(MAGIC) : len(MAGIC) + SALT_LEN]
    nonce = payload[len(MAGIC) + SALT_LEN : header_end]
    ciphertext = payload[header_end:]
    key = _derive_key(passphrase, salt)
    try:
        return AESGCM(key).decrypt(nonce, ciphertext, None)
    except Exception as e:
        # cryptography raises InvalidTag on bad passphrase or tampering. We
        # collapse both into one user-facing error so we don't leak which.
        raise ValueError("Wrong passphrase or corrupt backup") from e
