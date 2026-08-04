@echo off
title Stop Pokémon Team Builder Local Server
echo ========================================================
echo   Stopping Pokémon Team Builder Local Server...
echo ========================================================
taskkill /F /IM node.exe >nul 2>&1
echo.
echo   [SUCCESS] Server stopped cleanly.
echo ========================================================
pause
