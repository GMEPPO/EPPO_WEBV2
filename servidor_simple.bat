@echo off
title Chat Web - Servidor
color 0A
echo.
echo ========================================
echo   CHAT WEB - SERVIDOR
echo ========================================
echo.
echo Iniciando servidor...
echo.
echo Abre tu navegador en: http://localhost:8000
echo.
echo Presiona Ctrl+C para detener el servidor
echo.
echo ========================================
echo.
python servidor_simple.py
if errorlevel 1 (
    echo.
    echo ERROR: Python no encontrado
    echo.
    echo Por favor instala Python desde:
    echo https://www.python.org/downloads/
    echo.
    pause
)

