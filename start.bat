:start
title --- Bus Location ---
color 0a
@echo off
cls
node server

if %ERRORLEVEL% == 0 (
	timeout /t 1800
	::pause >nul
	goto start
) else if %ERRORLEVEL% == 1 (
	timeout /t 1800
	::pause >nul
	goto start
)