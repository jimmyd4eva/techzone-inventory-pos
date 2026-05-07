"""Regression tests for the AES-GCM backup envelope.

Pinning these protects against accidentally weakening the encryption (e.g.
shrinking PBKDF2 iteration count, removing GCM auth tag) on a future
performance pass.
"""
import pytest
from services.backup_crypto import encrypt, decrypt, is_encrypted, MAGIC


def test_round_trip():
    plaintext = b"hello world" * 1000
    blob = encrypt(plaintext, "correct horse battery staple")
    assert is_encrypted(blob)
    assert blob[:8] == MAGIC
    assert decrypt(blob, "correct horse battery staple") == plaintext


def test_wrong_passphrase_rejected():
    blob = encrypt(b"secret", "good-passphrase")
    with pytest.raises(ValueError, match="Wrong passphrase"):
        decrypt(blob, "bad-passphrase")


def test_tampered_ciphertext_rejected():
    blob = encrypt(b"secret", "good-passphrase")
    # Flip the last byte (auth tag region) — GCM must catch it
    tampered = bytearray(blob)
    tampered[-1] ^= 0x01
    with pytest.raises(ValueError):
        decrypt(bytes(tampered), "good-passphrase")


def test_truncated_payload_rejected():
    with pytest.raises(ValueError, match="truncated"):
        decrypt(MAGIC + b"\x00" * 20, "anything")


def test_plain_zip_not_misidentified():
    plain_zip = b"PK\x03\x04" + b"\x00" * 100  # Looks like a zip
    assert not is_encrypted(plain_zip)
    with pytest.raises(ValueError, match="Not an encrypted"):
        decrypt(plain_zip, "anything")


def test_two_encryptions_produce_different_ciphertexts():
    """Same passphrase + plaintext must produce different ciphertexts thanks
    to the random salt + nonce — proves we're not accidentally deterministic."""
    a = encrypt(b"same", "same-pass")
    b = encrypt(b"same", "same-pass")
    assert a != b
    assert decrypt(a, "same-pass") == decrypt(b, "same-pass") == b"same"
