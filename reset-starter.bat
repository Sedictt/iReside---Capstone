@echo off
setlocal
echo Running iReside Starter Account Reset...
node "%~dp0scripts\reset-starter-account.mjs" %*
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Reset failed with error code %ERRORLEVEL%.
)
endlocal
