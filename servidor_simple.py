#!/usr/bin/env python3
"""
Servidor HTTP simple para servir el chat web y evitar problemas de CORS
Ejecuta: python servidor_simple.py
"""

import http.server
import socketserver
import urllib.request
import urllib.parse
import json
import os
from pathlib import Path

PORT = 8000
N8N_WEBHOOK_URL = 'https://groupegmpi.app.n8n.cloud/webhook/761b05cc-158e-4140-9f11-8be71f4d2f3a'

class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Agregar headers CORS
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        # Manejar preflight requests
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        if self.path == '/api/chat':
            # Proxy para el webhook de n8n
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                # Enviar petición a n8n
                req = urllib.request.Request(
                    N8N_WEBHOOK_URL,
                    data=post_data,
                    headers={
                        'Content-Type': 'application/json',
                        'User-Agent': 'Chat-Web/1.0'
                    },
                    method='POST'
                )
                
                with urllib.request.urlopen(req, timeout=30) as response:
                    response_data = response.read()
                    response_text = response_data.decode('utf-8')
                    
                    # Enviar respuesta al cliente
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    
                    # Intentar parsear como JSON, si falla devolver como string
                    try:
                        json_data = json.loads(response_text)
                        # Asegurar formato correcto
                        if 'message' not in json_data:
                            json_data = {'message': response_text, 'links': [], 'documents': []}
                    except:
                        json_data = {'message': response_text, 'links': [], 'documents': []}
                    
                    self.wfile.write(json.dumps(json_data).encode('utf-8'))
                    
            except Exception as e:
                # Error al conectar con n8n
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                error_response = {
                    'error': str(e),
                    'message': 'Error al conectar con n8n. Verifica que el workflow esté activado.'
                }
                self.wfile.write(json.dumps(error_response).encode('utf-8'))
        else:
            super().do_POST()

    def do_GET(self):
        # Servir archivos estáticos
        if self.path == '/' or self.path == '/index.html':
            self.path = '/index.html'
        super().do_GET()

if __name__ == "__main__":
    # Cambiar al directorio del script
    os.chdir(Path(__file__).parent)
    
    Handler = CORSRequestHandler
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"🚀 Servidor iniciado en http://localhost:{PORT}")
        print(f"📂 Abre tu navegador en: http://localhost:{PORT}")
        print(f"🔗 Webhook de n8n configurado: {N8N_WEBHOOK_URL}")
        print(f"\n⚠️  Presiona Ctrl+C para detener el servidor\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n👋 Servidor detenido")

