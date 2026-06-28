import json
import os
import hashlib
import secrets
import re
import psycopg2

def handler(event: dict, context) -> dict:
    '''
    Регистрация и вход пользователей Радио Митя.
    Принимает POST { action: 'register'|'login'|'me', name?, email?, password?, token? }.
    Возвращает данные пользователя и токен сессии.
    '''
    method = event.get('httpMethod', 'GET')
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    }
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**cors, 'Access-Control-Max-Age': '86400'}, 'body': ''}

    headers = {**cors, 'Content-Type': 'application/json'}

    body = json.loads(event.get('body') or '{}')
    action = body.get('action', '')

    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()

    def respond(status, payload):
        cur.close()
        conn.close()
        return {'statusCode': status, 'headers': headers, 'body': json.dumps(payload, ensure_ascii=False)}

    def hash_pw(pw):
        return hashlib.sha256(pw.encode('utf-8')).hexdigest()

    if action == 'register':
        name = (body.get('name') or '').strip()
        email = (body.get('email') or '').strip().lower()
        password = body.get('password') or ''
        if not name or not email or not password:
            return respond(400, {'error': 'Заполните все поля'})
        if not re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', email):
            return respond(400, {'error': 'Неверный email'})
        if len(password) < 6:
            return respond(400, {'error': 'Пароль минимум 6 символов'})

        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cur.fetchone():
            return respond(409, {'error': 'Пользователь с таким email уже есть'})

        token = secrets.token_hex(24)
        cur.execute(
            "INSERT INTO users (name, email, password_hash, token) VALUES (%s, %s, %s, %s) RETURNING id",
            (name, email, hash_pw(password), token)
        )
        uid = cur.fetchone()[0]
        conn.commit()
        return respond(200, {'user': {'id': uid, 'name': name, 'email': email}, 'token': token})

    if action == 'login':
        email = (body.get('email') or '').strip().lower()
        password = body.get('password') or ''
        cur.execute("SELECT id, name, email, password_hash FROM users WHERE email = %s", (email,))
        row = cur.fetchone()
        if not row or row[3] != hash_pw(password):
            return respond(401, {'error': 'Неверный email или пароль'})
        token = secrets.token_hex(24)
        cur.execute("UPDATE users SET token = %s WHERE id = %s", (token, row[0]))
        conn.commit()
        return respond(200, {'user': {'id': row[0], 'name': row[1], 'email': row[2]}, 'token': token})

    if action == 'me':
        token = body.get('token') or event.get('headers', {}).get('X-Auth-Token', '')
        if not token:
            return respond(401, {'error': 'Нет токена'})
        cur.execute("SELECT id, name, email FROM users WHERE token = %s", (token,))
        row = cur.fetchone()
        if not row:
            return respond(401, {'error': 'Сессия не найдена'})
        return respond(200, {'user': {'id': row[0], 'name': row[1], 'email': row[2]}})

    return respond(400, {'error': 'Неизвестное действие'})
